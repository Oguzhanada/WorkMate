# DR-014 — Production Distributed State Must Be Redis-Backed

| Field | Value |
|-------|-------|
| **ID** | DR-014 |
| **Date** | 2026-03-14 |
| **Author** | Independent Audit + Ada |
| **Decision** | New FD-33 — rate limiting and circuit breaker state must use Redis in production |
| **Status** | Accepted |
| **Trigger** | Independent audit 2026-03-14 flagged in-memory rate limit (High) and in-memory circuit breaker (High) as ineffective in Vercel multi-instance deployment |

## Context

### Rate Limiting
`lib/rate-limit/index.ts` falls back to an in-memory Map when Upstash Redis env vars are missing. In Vercel's multi-instance model, each serverless function instance maintains its own counter. With N instances, an attacker can effectively multiply the rate limit by N.

The code already logs a production warning (line 138-141) but does not prevent deployment or expose this to health checks.

### Circuit Breaker
`lib/resilience/circuit-breaker.ts` stores all breaker state in a module-scope Map (line 132). Vercel cold starts reset this state. During a Stripe outage, multiple instances independently discover the failure, each making `failureThreshold` failing calls before opening their own breaker — causing a stampede effect on the upstream service.

## Decision

1. **Rate limiting**: In production, if Upstash env vars are missing, the rate limiter must:
   - Continue to function with in-memory fallback (graceful degradation preserved).
   - Export a `getRateLimitHealth()` function returning `'distributed' | 'degraded'`.
   - Health endpoint (`/api/health`) must include rate limit store status.
2. **Circuit breaker**: Export a `getCircuitBreakerHealth()` function that reports all breaker states.
   - Health endpoint must include circuit breaker states.
   - Redis-backed circuit breaker state is a future enhancement (tracked, not required now) due to complexity (distributed locks, Upstash latency).
3. **CI/deployment check**: Document that `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are required production env vars in `docs/PRODUCTION_LAUNCH.md`.

## Consequences

- Observability: operators can see degraded rate limiting in health checks.
- No silent degradation — degraded state is visible and monitorable.
- Circuit breaker remains in-memory (acceptable for Vercel's short instance lifetime) but is observable.

## Frozen Decision

**FD-33**: Production state-bearing middleware (rate limiter, circuit breaker) must expose health status. Rate limiter must use Redis (Upstash) in production; in-memory fallback must report `degraded` via health endpoint. `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are required production env vars.
