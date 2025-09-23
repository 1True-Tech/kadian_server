/**
 * PayPal order capture endpoint
 */
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { paypalClient } from '../../../../lib/config/paypal.js';
import logger from '../../../../lib/utils/logger.js';
import { validateRequest } from '../../../../lib/middleware/validateRequest.js';
import { z } from 'zod';
import connectDbOrders from '../../../../lib/utils/mongo/connect-db-orders.js';

// Validation schema for order capture
export const captureValidation = validateRequest({
  body: z.object({
    orderId: z.string().min(1, "Order ID is required")
  })
});

/**
 * Capture a PayPal order
 */
export default async function captureOrder(event) {
  try {
    const { orderId } = event.body;
    const clientIp = event.req.headers['x-forwarded-for'] || 'unknown';
    
    logger.payment.info({ orderId, clientIp }, 'Capturing PayPal order');

    // Create capture request
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.prefer("return=representation");
    
    // Execute request
    const response = await paypalClient.execute(request);
    
    if (response.statusCode !== 201) {
      logger.payment.error({ 
        statusCode: response.statusCode,
        orderId 
      }, 'Failed to capture PayPal order');
      
      return {
        data: null,
        statusCode: response.statusCode,
        message: "Failed to capture PayPal order"
      };
    }

    const captureResult = response.result;
    
    // Extract order details
    const purchaseUnit = captureResult.purchase_units[0];
    const capture = purchaseUnit.payments.captures[0];
    const customData = JSON.parse(purchaseUnit.custom_id || '{}');
    
    // Store order in database
    try {
      const db = await connectDbOrders();
      
      await db.collection('orders').insertOne({
        provider: 'paypal',
        orderId: captureResult.id,
        captureId: capture.id,
        status: captureResult.status,
        amount: {
          value: capture.amount.value,
          currency: capture.amount.currency_code
        },
        customerEmail: customData.customerEmail,
        metadata: customData,
        items: purchaseUnit.items,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      logger.payment.info({ 
        orderId: captureResult.id,
        status: captureResult.status 
      }, 'PayPal order saved to database');
    } catch (dbError) {
      logger.payment.error({ 
        error: dbError.message,
        orderId: captureResult.id 
      }, 'Failed to save PayPal order to database');
    }

    return {
      data: {
        orderId: captureResult.id,
        status: captureResult.status,
        captureId: capture.id
      },
      statusCode: 200,
      message: "PayPal order captured successfully"
    };
  } catch (error) {
    logger.payment.error({ 
      error: error.message 
    }, 'Error capturing PayPal order');
    
    return {
      data: null,
      statusCode: 500,
      message: "Error capturing PayPal order"
    };
  }
}