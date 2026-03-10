import { describe, expect, it } from 'vitest';

import { _deriveOverallStatus, CACHE_TTL_MS, CHECK_TIMEOUT_MS, type HealthCheckResult, type ServiceStatus } from '@/lib/monitoring/health-checks';

function makeResult(name: string, status: ServiceStatus): HealthCheckResult {
  return {
    name,
    status,
    latency_ms: 50,
    checked_at: new Date().toISOString(),
  };
}

describe('health-checks', () => {
  describe('deriveOverallStatus', () => {
    it('returns healthy when all services are healthy', () => {
      const services = [
        makeResult('Supabase', 'healthy'),
        makeResult('Stripe', 'healthy'),
      ];
      expect(_deriveOverallStatus(services)).toBe('healthy');
    });

    it('returns degraded when any service is degraded', () => {
      const services = [
        makeResult('Supabase', 'healthy'),
        makeResult('Stripe', 'degraded'),
        makeResult('Resend', 'healthy'),
      ];
      expect(_deriveOverallStatus(services)).toBe('degraded');
    });

    it('returns down when any service is down', () => {
      const services = [
        makeResult('Supabase', 'healthy'),
        makeResult('Stripe', 'down'),
        makeResult('Resend', 'degraded'),
      ];
      expect(_deriveOverallStatus(services)).toBe('down');
    });

    it('ignores disabled services in overall calculation', () => {
      const services = [
        makeResult('Supabase', 'healthy'),
        makeResult('Resend', 'disabled'),
        makeResult('Anthropic', 'disabled'),
      ];
      expect(_deriveOverallStatus(services)).toBe('healthy');
    });

    it('returns healthy when all services are disabled', () => {
      const services = [
        makeResult('Resend', 'disabled'),
        makeResult('Anthropic', 'disabled'),
      ];
      expect(_deriveOverallStatus(services)).toBe('healthy');
    });

    it('returns down if only active service is down, rest disabled', () => {
      const services = [
        makeResult('Supabase', 'down'),
        makeResult('Resend', 'disabled'),
      ];
      expect(_deriveOverallStatus(services)).toBe('down');
    });
  });

  describe('constants', () => {
    it('cache TTL is 60 seconds', () => {
      expect(CACHE_TTL_MS).toBe(60_000);
    });

    it('check timeout is 5 seconds', () => {
      expect(CHECK_TIMEOUT_MS).toBe(5_000);
    });
  });
});
