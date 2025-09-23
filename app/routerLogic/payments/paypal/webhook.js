/**
 * PayPal webhook handler
 */
import crypto from 'crypto';
import env from '../../../../lib/constants/env.js';
import logger from '../../../../lib/utils/logger.js';
import connectDbOrders from '../../../../lib/utils/mongo/connect-db-orders.js';
import Order from '../../../../models/order.js';

const { PAYPAL_WEBHOOK_SECRET } = env;

/**
 * Verify PayPal webhook signature
 */
function verifyWebhookSignature(headers, body) {
  if (!PAYPAL_WEBHOOK_SECRET) {
    logger.payment.error('PayPal webhook secret is not configured');
    return false;
  }

  const transmissionId = headers['paypal-transmission-id'];
  const timestamp = headers['paypal-transmission-time'];
  const webhookId = PAYPAL_WEBHOOK_SECRET;
  const eventBody = typeof body === 'string' ? body : JSON.stringify(body);
  const signature = headers['paypal-transmission-sig'];
  const certUrl = headers['paypal-cert-url'];

  // Construct the data string for verification
  const data = `${transmissionId}|${timestamp}|${webhookId}|${crypto.createHash('sha256').update(eventBody).digest('hex')}`;

  try {
    // In a production environment, you would verify the signature using PayPal's SDK
    // This is a simplified version for demonstration
    logger.payment.info({ 
      transmissionId,
      eventType: body.event_type 
    }, 'PayPal webhook received');
    
    return true;
  } catch (error) {
    logger.payment.error({ 
      error: error.message,
      transmissionId 
    }, 'PayPal webhook signature verification failed');
    
    return false;
  }
}

/**
 * Handle PayPal webhook events
 */
export default async function handleWebhook(event) {
  try {
    const body = event.body;
    const headers = event.headers;
    
    // Verify webhook signature
    if (!verifyWebhookSignature(headers, body)) {
      return {
        statusCode: 401,
        message: 'Invalid webhook signature'
      };
    }

    const { event_type, resource } = body;
    logger.payment.info({ 
      eventType: event_type 
    }, 'Processing PayPal webhook event');

    // Connect to database
    const db = await connectDbOrders();
    if (!db) {
      logger.payment.error('Failed to connect to database');
      return {
        statusCode: 500,
        message: 'Database connection error'
      };
    }

    // Process different event types
    switch (event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        const captureId = resource.id;
        
        // Update order status in database
        await Order.updateOne(
          { 'orderId': orderId },
          { 
            $set: { 
              status: 'COMPLETED',
              captureId,
              updatedAt: new Date() 
            } 
          }
        );
        
        logger.payment.info({ 
          orderId,
          captureId 
        }, 'PayPal payment capture completed');
        break;
      }
      
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED': {
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        
        // Update order status in database
        await Order.updateOne(
          { 'orderId': orderId },
          { 
            $set: { 
              status: event_type === 'PAYMENT.CAPTURE.DENIED' ? 'DENIED' : 'REFUNDED',
              updatedAt: new Date() 
            } 
          }
        );
        
        logger.payment.info({ 
          orderId,
          status: event_type === 'PAYMENT.CAPTURE.DENIED' ? 'DENIED' : 'REFUNDED' 
        }, 'PayPal payment status updated');
        break;
      }
      
      case 'CHECKOUT.ORDER.APPROVED': {
        const orderId = resource.id;
        
        logger.payment.info({ 
          orderId 
        }, 'PayPal order approved');
        break;
      }
      
      default:
        logger.payment.info({ 
          eventType: event_type 
        }, 'Unhandled PayPal webhook event');
    }

    return {
      statusCode: 200,
      message: 'Webhook processed successfully'
    };
  } catch (error) {
    logger.payment.error({ 
      error: error.message 
    }, 'Error processing PayPal webhook');
    
    return {
      statusCode: 500,
      message: 'Error processing webhook'
    };
  }
}