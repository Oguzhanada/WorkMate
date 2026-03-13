import { z } from 'zod';

const webhookEventValues = [
  'job.created',
  'quote.accepted',
  'payment.completed',
  'provider.approved',
  'document.verified',
  'document.rejected',
] as const;

export const webhookSubscribeSchema = z.object({
  url: z.string().url().refine((v) => v.startsWith('https://'), 'Webhook URL must use HTTPS.'),
  events: z.array(z.enum(webhookEventValues)).min(1).max(10),
});
