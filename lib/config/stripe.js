/**
 * Stripe configuration
 */
import Stripe from 'stripe';
import env from '../constants/env.js';
import logger from '../utils/logger.js';

const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = env;

// Initialize Stripe with the secret key
let stripe;

try {
  if (!STRIPE_SECRET_KEY) {
    logger.payment.warn('Stripe secret key not found in environment variables');
    throw new Error('Stripe secret key is required');
  }
  
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16', // Use the latest stable API version
    appInfo: {
      name: 'Kadian E-commerce',
      version: '1.0.0',
    },
  });
  
  logger.payment.info('Stripe initialized successfully');
} catch (error) {
  logger.payment.error({ error: error.message }, 'Failed to initialize Stripe');
  throw error;
}

export { stripe, STRIPE_WEBHOOK_SECRET };