/**
 * Stripe webhook handler
 */
import { stripe, STRIPE_WEBHOOK_SECRET } from "../../../../lib/config/stripe.js";
import logger from "../../../../lib/utils/logger.js";
import connectDbUsers from "../../../../lib/utils/mongo/connect-db-users.js";
import Order from "../../../../models/order.js";

/**
 * Process Stripe webhook events
 */
export default async function stripeWebhook(event) {
  try {
    const sig = event.headers['stripe-signature'];
    
    if (!sig) {
      logger.payment.warn('Missing Stripe signature');
      return {
        data: null,
        statusCode: 400,
        message: "Missing stripe-signature header"
      };
    }

    // Verify webhook signature
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.payment.warn({ error: err.message }, 'Invalid Stripe webhook signature');
      return {
        data: null,
        statusCode: 400,
        message: `Webhook signature verification failed: ${err.message}`
      };
    }

    // Connect to database
    try {
      await connectDbUsers();
    } catch (error) {
      logger.payment.error({ error: error.message }, 'Database connection error');
      return {
        data: null,
        statusCode: 500,
        message: "Database connection error"
      };
    }

    // Handle specific events
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;

        // Retrieve session with line items and customer
        const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
          session.id,
          { expand: ['line_items', 'customer'] }
        );
        const lineItems = sessionWithLineItems.line_items;
        const customerEmail = session.customer_email || (sessionWithLineItems.customer && sessionWithLineItems.customer.email);

        const orderId = session.metadata && session.metadata.orderId;

        // If we have an orderId from metadata, try to update existing order payment status
        if (orderId) {
          const existingOrder = await Order.findById(orderId);
          if (existingOrder) {
            // Idempotency: if already processed for this session, skip
            if (existingOrder.payment && existingOrder.payment.providerCheckoutSessionId === session.id && existingOrder.payment.status === 'paid') {
              logger.payment.info({ orderId, sessionId: session.id }, 'Stripe checkout already processed for order');
              break;
            }

            // Retrieve payment intent details to enrich payment info
            const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
            let receiptUrl;
            let paymentMethodDetails;
            try {
              if (paymentIntentId) {
                const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge', 'payment_method'] });
                const charge = pi.latest_charge ? (typeof pi.latest_charge === 'string' ? await stripe.charges.retrieve(pi.latest_charge) : pi.latest_charge) : undefined;
                const card = charge?.payment_method_details?.card || pi.payment_method?.card;
                paymentMethodDetails = card ? {
                  brand: card.brand,
                  last4: card.last4,
                  expMonth: card.exp_month,
                  expYear: card.exp_year,
                } : undefined;
                receiptUrl = charge?.receipt_url;
              }
            } catch (pmErr) {
              logger.payment.warn({ error: pmErr.message, paymentIntentId }, 'Failed to retrieve payment intent details');
            }

            // Update order fields
            existingOrder.status = 'paid';
            existingOrder.payment = {
              ...(existingOrder.payment || {}),
              method: existingOrder.payment?.method || 'card',
              provider: 'stripe',
              reference: paymentIntentId || session.id,
              amount: session.amount_total, // store in smallest currency unit (cents)
              currency: (session.currency || existingOrder.currency || 'USD').toUpperCase(),
              status: 'paid',
              providerOrderId: undefined,
              providerPaymentId: paymentIntentId || undefined,
              providerCheckoutSessionId: session.id,
              providerClientSecret: session.client_secret || undefined,
              paymentMethod: paymentMethodDetails,
              payer: { email: customerEmail },
              receiptUrl,
              paidAt: new Date(),
              webhookProcessedAt: new Date(),
            };

            existingOrder.paymentHistory = [
              ...(existingOrder.paymentHistory || []),
              {
                timestamp: new Date(),
                status: 'paid',
                provider: 'stripe',
                amount: session.amount_total,
                metadata: { sessionId: session.id, paymentIntentId },
                webhookEvent: 'checkout.session.completed',
              },
            ];

            existingOrder.rawWebhookEvents = [
              ...(existingOrder.rawWebhookEvents || []),
              stripeEvent,
            ];

            await existingOrder.save();
            logger.payment.info({ orderId: existingOrder._id, sessionId: session.id }, 'Order updated to paid from Stripe checkout');
            break;
          } else {
            logger.payment.warn({ orderId }, 'OrderId from Stripe metadata not found; falling back to creating new order');
          }
        }

        // Fallback: Create order in database if no orderId provided
        const order = new Order({
          payment: {
            method: 'card',
            provider: 'stripe',
            reference: (typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id) || session.id,
            amount: session.amount_total,
            currency: (session.currency || 'USD').toUpperCase(),
            status: 'paid',
            providerCheckoutSessionId: session.id,
            providerPaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
            paidAt: new Date(),
          },
          status: 'paid',
          items: (lineItems?.data || []).map(item => ({
            name: item.description,
            quantity: item.quantity,
            price: (item.amount_total || 0) / (item.quantity || 1),
            productId: item.price?.product?.metadata?.productId,
            variantSku: item.price?.product?.metadata?.variantSku,
          })),
          shippingAddress: session.shipping ? {
            line1: session.shipping.address.line1,
            line2: session.shipping.address.line2 || '',
            city: session.shipping.address.city,
            state: session.shipping.address.state,
            postal: session.shipping.address.postal_code,
            country: session.shipping.address.country,
          } : null,
          customerInfo: customerEmail ? {
            name: { first: session.customer_details?.name || '', last: '' },
            email: customerEmail,
            phone: session.customer_details?.phone || '',
          } : null,
          totalAmount: session.amount_total,
          currency: (session.currency || 'USD').toUpperCase(),
        });
        await order.save();
        logger.payment.info({ orderId: order._id, sessionId: session.id }, 'Order created from Stripe checkout');
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = stripeEvent.data.object;
        logger.payment.info({ paymentIntentId: paymentIntent.id }, 'Payment intent succeeded');
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = stripeEvent.data.object;
        logger.payment.warn({ 
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.last_payment_error && paymentIntent.last_payment_error.message
        }, 'Payment failed');
        break;
      }
      
      default:
        logger.payment.info({ type: stripeEvent.type }, 'Unhandled Stripe event');
    }

    return {
      data: { received: true },
      statusCode: 200,
      message: "Webhook received successfully"
    };
  } catch (error) {
    logger.payment.error({ error: error.message, stack: error.stack }, 'Error processing webhook');
    return {
      data: null,
      statusCode: 500,
      message: "Error processing webhook"
    };
  }
}