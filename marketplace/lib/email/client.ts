import { Resend } from 'resend';

let instance: Resend | null = null;

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
  if (!instance) instance = new Resend(apiKey);
  return instance;
}
