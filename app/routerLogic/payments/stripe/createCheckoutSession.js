/**
 * Stripe checkout session creation endpoint
 */
import { stripe } from "../../../../lib/config/stripe.js";
import env from "../../../../lib/constants/env.js";
import logger from "../../../../lib/utils/logger.js";
import { validateRequest } from "../../../../lib/middleware/validateRequest.js";
import { z } from "zod";
import Stripe from "stripe";

const { CLIENT_URL, STRIPE_CURRENCY } = env;

// Validation schema for checkout session
export const checkoutValidation = validateRequest({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string(),
          name: z.string(),
          price: z.number().positive(),
          quantity: z.number().int().positive(),
          variantSku: z.string().optional(),
          image: z.string().optional(),
        })
      )
      .min(1, "At least one item is required"),
    customer: z.object({
      email: z.string().email(),
      name: z.string().optional(),
    }),
    metadata: z.record(z.string()).optional(),
    orderId: z.string(),
    shippingInfo: z
      .object({
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        state: z.string().optional(),
        postal_code: z.string(),
        country: z.string(),
      })
      .optional(),
  }),
});

/**
 * Create a Stripe checkout session
 */
export default async function createCheckoutSession(event) {
  try {
    const { items, customer, metadata = {}, orderId, shippingInfo } = event.body;

    // Format line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: STRIPE_CURRENCY,
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          metadata: {
            productId: item.productId,
            variantSku: item.variantSku || "",
          },
        },
        unit_amount: item.price, // cents
      },
      quantity: item.quantity,
    }));

    const sessionParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: customer.email,
      success_url: `${CLIENT_URL}/checkout/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/checkout/${orderId}/cancel`,
      metadata: { ...metadata, orderId, customerId: customer.email },
      
    };

    

    const session = await stripe.checkout.sessions.create({...sessionParams, shipping_address_collection:{
      allowed_countries: [
        "US",
        "JM" 
      ]
    }});

    logger.payment.info({ sessionId: session.id }, "Stripe checkout session created");

    return {
      id: session.id,
      url: session.url,
      data: { sessionId: session.id, url: session.url },
      statusCode: 200,
      message: "Checkout session created successfully",
    };
  } catch (error) {
    logger.payment.error({ error: error.message }, "Failed to create checkout session");

    return { data: null, statusCode: 500, message: "Failed to create checkout session" };
  }
}
