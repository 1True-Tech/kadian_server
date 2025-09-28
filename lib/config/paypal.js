/**
 * PayPal configuration
 */
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import env from '../constants/env.js';
import logger from '../utils/logger.js';

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE } = env;

// Configure PayPal environment
function environment() {
  const clientId = PAYPAL_CLIENT_ID;
  const clientSecret = PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    logger.payment.error('PayPal client ID or secret missing');
    throw new Error('PayPal client ID and secret are required');
  }

  if (PAYPAL_MODE === 'live') {
    logger.payment.info('Using PayPal live environment');
    return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
  }

  logger.payment.info('Using PayPal sandbox environment');
  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

// Create PayPal client
let paypalClient;

try {
  paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(environment());
  logger.payment.info('PayPal client initialized successfully');
} catch (error) {
  logger.payment.error({ error: error.message }, 'Failed to initialize PayPal client');
  throw error;
}

export { paypalClient };