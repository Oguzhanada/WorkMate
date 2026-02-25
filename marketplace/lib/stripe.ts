import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

const parsedRate = Number(process.env.PLATFORM_COMMISSION_RATE ?? '0');
export const PLATFORM_COMMISSION_RATE =
  Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 0.3 ? parsedRate : 0;
