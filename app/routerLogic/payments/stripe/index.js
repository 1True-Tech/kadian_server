/**
 * Stripe routes index
 */
import createCheckoutSession from './createCheckoutSession.js';
import webhook from './webhook.js';

export default {
  createCheckoutSession,
  webhook
};