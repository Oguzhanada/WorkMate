/**
 * DEPRECATED — re-export barrel only (DR-010, 2026-03-13).
 *
 * Do NOT add new schema definitions here.
 * Add new schemas to the appropriate domain file:
 *
 *   auth.ts         — login, register, reset password
 *   jobs.ts         — job CRUD, messages, todos, contracts, time tracking
 *   quotes.ts       — quotes, offers
 *   billing.ts      — Stripe, payments, subscriptions
 *   disputes.ts     — disputes, evidence, resolution
 *   admin.ts        — admin ops, feature flags, compliance, GDPR admin
 *   profile.ts      — profile, portfolio, reviews, favourites, GDPR self-service
 *   search.ts       — provider search, saved searches, task alerts, public jobs query
 *   availability.ts — provider availability, appointments
 *   dashboard.ts    — dashboard widgets
 *   notifications.ts — notification query and mark-read
 *   analytics.ts    — funnel telemetry
 *   ai.ts           — AI alert suggestions, job description generation
 *   webhooks.ts     — public API webhook subscription
 *
 * Existing imports from this file continue to work.
 * New code must import directly from the domain file.
 */

export * from './auth';
export * from './jobs';
export * from './quotes';
export * from './billing';
export * from './disputes';
export * from './admin';
export * from './profile';
export * from './search';
export * from './availability';
export * from './dashboard';
export * from './notifications';
export * from './analytics';
export * from './ai';
export * from './webhooks';
