import * as Sentry from '@sentry/nextjs';

const PII_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,  // email
  /\+?\d[\d\s\-()]{7,}\d/g,                              // phone
  /[A-Z]\d{2}\s?\w?\d{4}/gi,                             // eircode
];

function scrubPII(value: string): string {
  let result = value;
  for (const pattern of PII_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

function scrubEventData(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (ex.value) ex.value = scrubPII(ex.value);
      if (ex.stacktrace?.frames) {
        for (const frame of ex.stacktrace.frames) {
          if (frame.vars) {
            for (const key of Object.keys(frame.vars)) {
              if (typeof frame.vars[key] === 'string') {
                frame.vars[key] = scrubPII(frame.vars[key] as string);
              }
            }
          }
        }
      }
    }
  }
  if (event.request?.data && typeof event.request.data === 'string') {
    event.request.data = scrubPII(event.request.data);
  }
  if (event.request?.query_string && typeof event.request.query_string === 'string') {
    event.request.query_string = scrubPII(event.request.query_string);
  }
  return event;
}

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  // Performance monitoring — 10% in production
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  beforeSend(event) {
    return scrubEventData(event);
  },

  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.message) {
      breadcrumb.message = scrubPII(breadcrumb.message);
    }
    if (breadcrumb.data?.url && typeof breadcrumb.data.url === 'string') {
      breadcrumb.data.url = scrubPII(breadcrumb.data.url);
    }
    return breadcrumb;
  },

  // Don't send events in development unless explicitly enabled
  enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',
});
