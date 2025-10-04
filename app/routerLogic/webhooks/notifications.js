import webhookService from '../../../lib/utils/webhookService.js';
import logger from '../../../lib/utils/logger.js';
import { z } from 'zod';

/**
 * Handle webhook notifications for various events
 * @param {import('../../../lib/utils/withErrorHandling.js').RouteEvent} event - event object
 */
const handleWebhookNotification = async (event) => {
  const {req, res} = event;
  try {
    // Validate webhook payload
    const schema = z.object({
      eventType: z.string(),
      eventData: z.object({}).passthrough(),
      secret: z.string().optional()
    });

    const { eventType, eventData, secret } = schema.parse(req.body);

    // Verify webhook secret if in production
    if (process.env.NODE_ENV === 'production') {
      if (secret !== process.env.WEBHOOK_SECRET) {
        logger.app.warn({ ip: req.ip }, 'Invalid webhook secret');
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }

    // Process the event
    const result = await webhookService.processEvent(eventType, eventData);

    if (result.success) {
      return res.status(200).json({ message: 'Event processed successfully', result });
    } else {
      return res.status(422).json({ message: 'Event processing failed', error: result.error });
    }
  } catch (error) {
    logger.app.error({ error: error.message }, 'Webhook notification error');
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid webhook payload', errors: error.errors });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handleWebhookNotification;