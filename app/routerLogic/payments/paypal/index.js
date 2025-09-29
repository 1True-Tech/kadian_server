/**
 * PayPal routes index
 */
import createOrder, { orderValidation } from './createOrder.js';
import captureOrder, { captureValidation } from './captureOrder.js';
import handleWebhook from './webhook.js';

export default {
  createOrder: {
    handler: createOrder,
    middlewares: [orderValidation]
  },
  captureOrder: {
    handler: captureOrder,
    middlewares: [captureValidation]
  },
  webhook: {
    handler: handleWebhook,
    middlewares: []
  }
};