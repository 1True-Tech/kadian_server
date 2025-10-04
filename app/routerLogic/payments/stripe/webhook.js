/**
 * Stripe webhook handler
 */
import { stripe, STRIPE_WEBHOOK_SECRET } from "../../../../lib/config/stripe.js";
import logger from "../../../../lib/utils/logger.js";
import connectDbUsers from "../../../../lib/utils/mongo/connect-db-users.js";
import Order from "../../../../models/order.js";

/**
 * 
 * @param {import("../../../../lib/utils/withErrorHandling.js").RouteEvent} event 
 * @returns 
 */
export default async function stripeWebhook(event) {
  try {
    const sig = event.req.headers["stripe-signature"];
    if (!sig) {
      logger.payment.warn("Missing Stripe signature");
      return { data: null, statusCode: 400, message: "Missing stripe-signature header" };
    }

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(event.req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.payment.warn({ error: err.message }, "Invalid Stripe webhook signature");
      return { data: null, statusCode: 400, message: `Webhook verification failed: ${err.message}` };
    }

    await connectDbUsers();

    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        const orderId = session.metadata?.orderId || null;
        const customerEmail = session.customer_email || session.customer_details?.email;

        let existingOrder = orderId ? await Order.findById(orderId) : null;

        const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id);
        console.log(sessionWithLineItems)
        const lineItems = sessionWithLineItems.line_items?.data || [];

        const items = lineItems.map((item) => ({
          productId: item.price?.product?.metadata?.productId || "",
          variantSku: item.price?.product?.metadata?.variantSku || "",
          name: item.description || "",
          quantity: item.quantity || 1,
          price: ((item.amount_total || 0) / (item.quantity || 1)) / 100, // convert cents to unit
        }));

        const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

        const payment = {
          method: "card",
          provider: "stripe",
          reference: paymentIntentId || session.id,
          providerPaymentId: paymentIntentId || undefined,
          providerCheckoutSessionId: session.id,
          status: "paid",
          currency: (session.currency || "USD").toUpperCase(),
          amount: (session.amount_total || 0) / 100, // cents → unit
          paidAt: new Date(),
          webhookProcessedAt: new Date(),
          paymentMethod: session.payment_method_types ? { brand: "card" } : undefined,
          payer: { email: customerEmail },
          receiptUrl: session.payment_intent ? undefined : session.url,
        };

        if (existingOrder) {
          existingOrder.status = "paid";
          existingOrder.items = items;
          existingOrder.payment = payment;
          existingOrder.paymentHistory = [
            ...(existingOrder.paymentHistory || []),
            {
              timestamp: new Date(),
              status: "paid",
              provider: "stripe",
              amount: payment.amount,
              metadata: { sessionId: session.id, paymentIntentId },
              webhookEvent: "checkout.session.completed",
            },
          ];
          existingOrder.rawWebhookEvents = [...(existingOrder.rawWebhookEvents || []), stripeEvent];
          existingOrder.totalAmount = payment.amount;
          existingOrder.currency = payment.currency;

          await existingOrder.save();
          logger.payment.info({ orderId: existingOrder._id }, "Order updated to paid");
        } else {
          const newOrder = new Order({
            userId: null,
            guestId: null,
            status: "paid",
            items,
            payment,
            paymentHistory: [
              {
                timestamp: new Date(),
                status: "paid",
                provider: "stripe",
                amount: payment.amount,
                metadata: { sessionId: session.id, paymentIntentId },
                webhookEvent: "checkout.session.completed",
              },
            ],
            rawWebhookEvents: [stripeEvent],
            shippingAddress: session.shipping ? {
              line1: session.shipping.address.line1,
              line2: session.shipping.address.line2 || "",
              city: session.shipping.address.city,
              state: session.shipping.address.state,
              postal: session.shipping.address.postal_code,
              country: session.shipping.address.country,
            } : null,
            customerInfo: customerEmail ? {
              name: { first: session.customer_details?.name || "", last: "" },
              email: customerEmail,
              phone: session.customer_details?.phone || "",
            } : null,
            totalAmount: payment.amount,
            currency: (session.currency || "USD").toUpperCase(),
          });

          await newOrder.save();
          logger.payment.info({ orderId: newOrder._id }, "New order created from Stripe webhook");
        }
        break;
      }

      default:
        logger.payment.info({ type: stripeEvent.type }, "Unhandled Stripe event");
    }

    return { data: { received: true }, statusCode: 200, message: "Webhook processed successfully" };
  } catch (err) {
    logger.payment.error({ error: err.message, stack: err.stack }, "Webhook processing error");
    return { data: null, statusCode: 500, message: "Webhook processing error" };
  }
}
