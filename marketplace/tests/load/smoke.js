/**
 * k6 Load Test — WorkMate Smoke Scenario
 *
 * Run locally:   k6 run tests/load/smoke.js
 * With env vars: k6 run -e BASE_URL=https://workmate.ie tests/load/smoke.js
 *
 * Scenarios:
 *   smoke  — 5 VUs for 30s (baseline)
 *   load   — ramp 10→50→10 VUs over 3 minutes
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');
const homepageLatency = new Trend('homepage_latency', true);
const apiHealthLatency = new Trend('api_health_latency', true);
const providersLatency = new Trend('providers_latency', true);

// P95 latency budget: 500ms for pages, 200ms for API
export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      tags: { scenario: 'smoke' },
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '1m', target: 0 },
      ],
      tags: { scenario: 'load' },
      startTime: '35s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.05'],
    homepage_latency: ['p(95)<600'],
    api_health_latency: ['p(95)<200'],
    providers_latency: ['p(95)<800'],
  },
};

export default function () {
  // 1. Homepage
  const home = http.get(`${BASE_URL}/en`);
  homepageLatency.add(home.timings.duration);
  check(home, {
    'homepage 200': (r) => r.status === 200,
    'homepage has content': (r) => r.body && r.body.length > 0,
  }) || errorRate.add(1);

  sleep(1);

  // 2. Health API
  const health = http.get(`${BASE_URL}/api/health`);
  apiHealthLatency.add(health.timings.duration);
  check(health, {
    'health 200': (r) => r.status === 200,
    'health status ok': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'ok' || body.status === 'degraded';
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(0.5);

  // 3. Services page
  const services = http.get(`${BASE_URL}/en/services`);
  check(services, {
    'services 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.5);

  // 4. Providers page
  const providers = http.get(`${BASE_URL}/en/providers`);
  providersLatency.add(providers.timings.duration);
  check(providers, {
    'providers 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.5);

  // 5. Login page (static)
  const login = http.get(`${BASE_URL}/en/login`);
  check(login, {
    'login 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'tests/load/summary.json': JSON.stringify(data, null, 2),
  };
}

// k6 built-in text summary
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.3/index.js';
