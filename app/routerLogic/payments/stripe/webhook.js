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
        
        // Retrieve session with line items
        const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
          session.id,
          { expand: ['line_items', 'customer'] }
        );
        
        const lineItems = sessionWithLineItems.line_items;
        const customerEmail = session.customer_email || (sessionWithLineItems.customer && sessionWithLineItems.customer.email);
        
        // Create order in database
        const order = new Order({
          paymentProvider: 'stripe',
          paymentId: session.id,
          customerId: customerEmail,
          amount: session.amount_total / 100, // Convert from cents
          currency: session.currency,
          status: 'paid',
          items: lineItems.data.map(item => ({
            name: item.description,
            quantity: item.quantity,
            price: item.amount_total / 100 / item.quantity,
            productId: item.price.product.metadata.productId,
            variantSku: item.price.product.metadata.variantSku
          })),
          shippingAddress: session.shipping ? {
            name: session.shipping.name,
            line1: session.shipping.address.line1,
            line2: session.shipping.address.line2 || '',
            city: session.shipping.address.city,
            state: session.shipping.address.state,
            postalCode: session.shipping.address.postal_code,
            country: session.shipping.address.country,
          } : null,
          metadata: session.metadata
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