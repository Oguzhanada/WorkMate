/**
 * Stripe Circuit Breaker Wrapper
 * ─────────────────────────────────────────────────────────────
 * Wraps Stripe SDK calls with a circuit breaker to prevent
 * cascading failures when the Stripe API is unresponsive.
 *
 * Usage:
 *   const session = await executeStripeCall(() =>
 *     stripe.checkout.sessions.create({ ... })
 *   );
 */

import { getCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { setServiceStatus } from '@/lib/resilience/service-status';

const BREAKER_NAME = 'stripe';

/**
 * Execute a Stripe API call through the circuit breaker.
 *
 * - On success: marks Stripe as 'healthy'.
 * - On failure: the breaker accumulates failures; after 3 consecutive
 *   failures the circuit opens and marks Stripe as 'down'.
 * - When the circuit is OPEN, calls are rejected immediately with a
 *   CircuitBreakerOpenError (unless a fallback is provided).
 */
export async function executeStripeCall<T>(
  fn: () => Promise<T>,
  fallback?: () => T | Promise<T>,
): Promise<T> {
  const breaker = getCircuitBreaker(BREAKER_NAME, {
    failureThreshold: 3,
    resetTimeoutMs: 30_000,
  });

  return breaker.execute(async () => {
    try {
      const result = await fn();
      setServiceStatus(BREAKER_NAME, 'healthy');
      return result;
    } catch (err) {
      setServiceStatus(BREAKER_NAME, 'down');
      throw err;
    }
  }, fallback);
}
