/**
 * Circuit Breaker
 * ─────────────────────────────────────────────────────────────
 * Protects downstream calls from cascading failures via the
 * classic three-state machine: CLOSED → OPEN → HALF_OPEN.
 *
 * Transitions:
 *   CLOSED    — normal operation; failures accumulate.
 *   OPEN      — after `failureThreshold` consecutive failures;
 *               all calls are rejected immediately for `resetTimeoutMs`.
 *   HALF_OPEN — one probe request is allowed through.
 *               Success  → back to CLOSED (counters reset).
 *               Failure  → back to OPEN (timer restarted).
 *
 * Named instances are stored in a module-scope Map so that callers
 * sharing the same service name share the same breaker state.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Consecutive failures required to open the circuit. Default: 3 */
  failureThreshold?: number;
  /** Milliseconds to wait in OPEN before moving to HALF_OPEN. Default: 300_000 (5 min) */
  resetTimeoutMs?: number;
}

// ── Class ────────────────────────────────────────────────────────────────────

export class CircuitBreaker {
  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  private state: CircuitBreakerState = 'CLOSED';
  private consecutiveFailures = 0;
  private openedAt: number | null = null;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold ?? 3;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 300_000;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  getState(): CircuitBreakerState {
    this._maybeTransitionToHalfOpen();
    return this.state;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.openedAt = null;
  }

  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => T | Promise<T>
  ): Promise<T> {
    this._maybeTransitionToHalfOpen();

    if (this.state === 'OPEN') {
      if (fallback) return fallback();
      throw new CircuitBreakerOpenError(this.name);
    }

    // CLOSED or HALF_OPEN — attempt the call
    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      if (fallback) return fallback();
      throw err;
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private _maybeTransitionToHalfOpen(): void {
    if (
      this.state === 'OPEN' &&
      this.openedAt !== null &&
      Date.now() - this.openedAt >= this.resetTimeoutMs
    ) {
      this.state = 'HALF_OPEN';
    }
  }

  private _onSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = null;
    this.state = 'CLOSED';
  }

  private _onFailure(): void {
    if (this.state === 'HALF_OPEN') {
      // Probe failed — reopen immediately
      this._open();
      return;
    }

    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.failureThreshold) {
      this._open();
    }
  }

  private _open(): void {
    this.state = 'OPEN';
    this.openedAt = Date.now();
    this.consecutiveFailures = 0;
  }
}

// ── Custom error ─────────────────────────────────────────────────────────────

export class CircuitBreakerOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker "${name}" is OPEN — request rejected`);
    this.name = 'CircuitBreakerOpenError';
  }
}

// ── Named-instance registry ──────────────────────────────────────────────────

const breakers = new Map<string, CircuitBreaker>();

/**
 * Retrieve (or lazily create) a named CircuitBreaker instance.
 * Options are only applied on first creation; subsequent calls
 * with the same name return the existing instance.
 */
export function getCircuitBreaker(
  name: string,
  options?: CircuitBreakerOptions
): CircuitBreaker {
  const existing = breakers.get(name);
  if (existing) return existing;

  const breaker = new CircuitBreaker(name, options);
  breakers.set(name, breaker);
  return breaker;
}

/**
 * Create a new named CircuitBreaker instance, replacing any existing
 * one with the same name. Use when you need fresh options at startup.
 */
export function createCircuitBreaker(
  name: string,
  options?: CircuitBreakerOptions
): CircuitBreaker {
  const breaker = new CircuitBreaker(name, options);
  breakers.set(name, breaker);
  return breaker;
}

// ── Health reporting (FD-33) ────────────────────────────────────────────────

export type CircuitBreakerHealthEntry = {
  name: string;
  state: CircuitBreakerState;
};

/**
 * Returns the current state of all registered circuit breakers.
 * Exposed via /api/health for observability per FD-33 / DR-014.
 */
export function getCircuitBreakerHealth(): CircuitBreakerHealthEntry[] {
  const entries: CircuitBreakerHealthEntry[] = [];
  for (const [name, breaker] of breakers.entries()) {
    entries.push({ name, state: breaker.getState() });
  }
  return entries;
}
