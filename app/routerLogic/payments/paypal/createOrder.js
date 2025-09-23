/**
 * PayPal order creation endpoint
 */
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { paypalClient } from '../../../../lib/config/paypal.js';
import env from '../../../../lib/constants/env.js';
import logger from '../../../../lib/utils/logger.js';
import { validateRequest } from '../../../../lib/middleware/validateRequest.js';
import { z } from 'zod';

const { CLIENT_URL } = env;

// Validation schema for order creation
export const orderValidation = validateRequest({
  body: z.object({
    items: z.array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
        sku: z.string().optional()
      })
    ).min(1, "At least one item is required"),
    customer: z.object({
      email: z.string().email(),
      name: z.string().optional()
    }),
    metadata: z.record(z.string()).optional()
  })
});

/**
 * Create a PayPal order
 */
export default async function createOrder(event) {
  try {
    const { items, customer, metadata = {} } = event.body;
    
    // Calculate order total
    const orderTotal = items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    ).toFixed(2);

    // Create order request
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    
    // Format request body
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: orderTotal,
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: orderTotal
              }
            }
          },
          items: items.map(item => ({
            name: item.name,
            description: item.description || item.name,
            unit_amount: {
              currency_code: 'USD',
              value: item.price.toFixed(2)
            },
            quantity: item.quantity,
            sku: item.sku || undefined
          })),
          custom_id: JSON.stringify({
            customerEmail: customer.email,
            ...metadata
          })
        }
      ],
      application_context: {
        brand_name: 'Kadian E-commerce',
        landing_page: 'BILLING',
        shipping_preference: 'SET_PROVIDED_ADDRESS',
        user_action: 'PAY_NOW',
        return_url: `${CLIENT_URL}/checkout/success`,
        cancel_url: `${CLIENT_URL}/checkout/cancel`
      }
    });

    // Execute request
    const response = await paypalClient.execute(request);
    
    if (response.statusCode !== 201) {
      logger.payment.error({ statusCode: response.statusCode }, 'Failed to create PayPal order');
      return {
        data: null,
        statusCode: response.statusCode,
        message: "Failed to create PayPal order"
      };
    }

    const order = response.result;
    logger.payment.info({ orderId: order.id }, 'PayPal order created successfully');

    return {
      data: {
        orderId: order.id,
        links: order.links,
        status: order.status
      },
      statusCode: 200,
      message: "PayPal order created successfully"
    };
  } catch (error) {
    logger.payment.error({ error: error.message }, 'Error creating PayPal order');
    return {
      data: null,
      statusCode: 500,
      message: "Error creating PayPal order"
    };
  }
}