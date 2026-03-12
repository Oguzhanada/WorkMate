// ── Structured logger ─────────────────────────────────────────────────────────
// Lightweight structured logging without adding a package dependency.
// Output format is JSON-compatible in production (Vercel log drain / Datadog ready)
// and human-readable in development.
//
// To swap in pino later:
//   npm install pino
//   Replace this file with: import pino from 'pino'; export const logger = pino({...});
//   The API (logger.info / logger.warn / logger.error) stays the same.
//
// Sensitive field redaction:
// The following fields are automatically stripped from log output:
//   password, token, api_key, api_key_hash, authorization, cookie,
//   access_token, refresh_token, stripe_key, supabase_key
// ─────────────────────────────────────────────────────────────────────────────

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'api_key',
  'api_key_hash',
  'authorization',
  'cookie',
  'access_token',
  'refresh_token',
  'stripe_key',
  'supabase_key',
  'secret',
  'private_key',
]);

function redact(obj: LogContext): LogContext {
  const result: LogContext = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = redact(value as LogContext);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

function log(level: LogLevel, context: LogContext, message: string): void {
  if (isTest) return; // Suppress logs during tests

  const safe = redact(context);
  const entry = {
    level,
    service: 'workmate-api',
    msg: message,
    time: new Date().toISOString(),
    ...safe,
  };

  if (isProd) {
    // JSON output — structured log drain compatible
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(JSON.stringify(entry));
  } else {
    // Human-readable in development
    const prefix = `[${level.toUpperCase()}]`;
    const contextStr = Object.keys(safe).length ? ` ${JSON.stringify(safe)}` : '';
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(`${prefix} ${message}${contextStr}`);
  }
}

export const logger = {
  debug: (context: LogContext, message: string) => log('debug', context, message),
  info: (context: LogContext, message: string) => log('info', context, message),
  warn: (context: LogContext, message: string) => log('warn', context, message),
  error: (context: LogContext, message: string) => log('error', context, message),
};

// ── Convenience helpers ───────────────────────────────────────────────────────

/** Log an AI call (model, token count, latency) */
export function logAiCall(opts: {
  model: string;
  endpoint: string;
  userId: string;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}): void {
  if (opts.error) {
    logger.error({ ...opts }, 'AI inference failed');
  } else {
    logger.info({ ...opts }, 'AI inference completed');
  }
}

/** Log a webhook delivery attempt */
export function logWebhookDelivery(opts: {
  subscriptionId: string;
  event: string;
  statusCode?: number;
  attempt: number;
  success: boolean;
  durationMs: number;
}): void {
  if (opts.success) {
    logger.info({ ...opts }, 'Webhook delivered');
  } else {
    logger.warn({ ...opts }, 'Webhook delivery failed');
  }
}

/** Log an API error (for use in route handlers as a fallback to Sentry) */
export function logApiError(opts: {
  route: string;
  method: string;
  statusCode: number;
  error: string;
  userId?: string;
}): void {
  logger.error({ ...opts }, 'API route error');
}
