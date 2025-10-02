import { sendNotificationEmail } from './emailService.js';
import logger from './logger.js';

/**
 * Webhook service for handling various events and sending appropriate notifications
 */
class WebhookService {
  /**
   * Process an event and send notifications to appropriate recipients
   * @param {string} eventType - Type of event (user_created, order_created, etc.)
   * @param {Object} eventData - Data related to the event
   * @returns {Promise<Object>} - Processing result
   */
  async processEvent(eventType, eventData) {
    try {
      logger.info({ eventType, eventData }, 'Processing webhook event');
      
      switch (eventType) {
        case 'user_created':
          return await this.handleUserCreated(eventData);
        
        case 'order_created':
          return await this.handleOrderCreated(eventData);
        
        case 'order_status_changed':
          return await this.handleOrderStatusChanged(eventData);
        
        case 'account_updated':
          return await this.handleAccountUpdated(eventData);
          
        default:
          logger.warn({ eventType }, 'Unknown event type');
          return { success: false, message: 'Unknown event type' };
      }
    } catch (error) {
      logger.error({ error: error.message, eventType }, 'Error processing webhook event');
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle user creation event
   * @param {Object} data - User data
   * @returns {Promise<Object>} - Processing result
   */
  async handleUserCreated(data) {
    const { user } = data;
    const results = [];

    // Send welcome email to user
    const userEmailResult = await sendNotificationEmail({
      to: user.email,
      subject: 'Welcome to Kadian!',
      template: 'welcome',
      data: { name: user.name || user.firstName || 'Valued Customer' }
    });
    results.push(userEmailResult);

    // Send notification to admin
    const adminEmailResult = await sendNotificationEmail({
      to: process.env.ADMIN_EMAIL || 'admin@kadian.com',
      subject: 'New User Registration',
      template: 'admin_new_user',
      data: {
        userName: user.name || `${user.firstName} ${user.lastName}` || user.email,
        userEmail: user.email
      }
    });
    results.push(adminEmailResult);

    return {
      success: results.every(r => r.success),
      results
    };
  }

  /**
   * Handle order creation event
   * @param {Object} data - Order data
   * @returns {Promise<Object>} - Processing result
   */
  async handleOrderCreated(data) {
    const { order, user } = data;
    const results = [];

    // Send confirmation to customer
    const customerEmailResult = await sendNotificationEmail({
      to: user.email,
      subject: 'Order Confirmation',
      template: 'order_confirmation',
      data: {
        name: user.name || user.firstName || 'Valued Customer',
        orderId: order._id || order.id,
        total: order.total
      }
    });
    results.push(customerEmailResult);

    // Send notification to admin
    const adminEmailResult = await sendNotificationEmail({
      to: process.env.ADMIN_EMAIL || 'admin@kadian.com',
      subject: 'New Order Received',
      template: 'admin_new_order',
      data: {
        orderId: order._id || order.id,
        userName: user.name || `${user.firstName} ${user.lastName}` || user.email,
        total: order.total
      }
    });
    results.push(adminEmailResult);

    return {
      success: results.every(r => r.success),
      results
    };
  }

  /**
   * Handle order status change event
   * @param {Object} data - Order status data
   * @returns {Promise<Object>} - Processing result
   */
  async handleOrderStatusChanged(data) {
    const { order, user, newStatus } = data;
    
    // Send status update to customer
    const result = await sendNotificationEmail({
      to: user.email,
      subject: `Order Status Update: ${newStatus}`,
      template: 'order_status',
      data: {
        name: user.name || user.firstName || 'Valued Customer',
        orderId: order._id || order.id,
        status: newStatus
      }
    });

    return {
      success: result.success,
      result
    };
  }

  /**
   * Handle account update event
   * @param {Object} data - Account update data
   * @returns {Promise<Object>} - Processing result
   */
  async handleAccountUpdated(data) {
    const { user, updateType } = data;
    
    // Send confirmation to user
    const result = await sendNotificationEmail({
      to: user.email,
      subject: 'Account Update Confirmation',
      template: 'account_update',
      data: {
        name: user.name || user.firstName || 'Valued Customer',
        updateType
      }
    });

    return {
      success: result.success,
      result
    };
  }
}

export default new WebhookService();