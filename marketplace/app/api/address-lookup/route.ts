import { NextRequest, NextResponse } from 'next/server';
import { normalizeEircode } from '@/lib/ireland/eircode';
import { addressLookupQuerySchema } from '@/lib/validation/api';
import { apiError } from '@/lib/api/error-response';
import { cacheGet } from '@/lib/cache';
import { getServiceStatus, setServiceStatus } from '@/lib/resilience/service-status';
import { withRequestId } from '@/lib/request-id/middleware';

type AddressData = {
  eircode: string;
  is_format_valid: boolean;
  line_1: string | null;
  line_2: string | null;
  post_town: string | null;
  county: string | null;
  country: string;
};

async function handler(request: NextRequest) {
  const parsed = addressLookupQuerySchema.safeParse({
    eircode: request.nextUrl.searchParams.get('eircode') ?? '',
  });

  if (!parsed.success) {
    return apiError('Invalid request query', 400);
  }

  const eircode = normalizeEircode(parsed.data.eircode);
  const provider = process.env.ADDRESS_PROVIDER ?? 'none';

  // Format-only validation (no API key required)
  if (provider !== 'ideal_postcodes') {
    return NextResponse.json({
      address: { eircode, is_format_valid: true },
      provider: 'format_only',
    });
  }

  // Early exit if Ideal Postcodes is known to be down
  if ((await getServiceStatus('ideal_postcodes')) === 'down') {
    return apiError('Address lookup temporarily unavailable', 503);
  }

  // Ideal Postcodes live lookup
  const apiKey = process.env.IDEAL_POSTCODES_API_KEY;
  if (!apiKey) {
    return apiError('Address lookup not configured', 503);
  }

  // Cache successful address lookups for 1 hour — Eircode data rarely changes.
  // On fetch error the fetcher throws, so cacheGet will not cache failures.
  const cacheKey = `address:${eircode}`;

  try {
    const address = await cacheGet<AddressData>(cacheKey, async () => {
      const res = await fetch(
        `https://api.ideal-postcodes.co.uk/v1/eircodes/${encodeURIComponent(eircode)}?api_key=${apiKey}`,
        { next: { revalidate: 86400 } } // Next.js fetch cache 24h
      );

      if (res.status === 404) {
        throw new Error('NOT_FOUND');
      }

      if (!res.ok) {
        throw new Error('UPSTREAM_ERROR');
      }

      const data = await res.json();
      const r = data.result ?? {};

      return {
        eircode,
        is_format_valid: true,
        line_1: r.line_1 ?? null,
        line_2: r.line_2 ?? null,
        post_town: r.post_town ?? null,
        county: r.county ?? null,
        country: r.country ?? 'Ireland',
      };
    }, 3600);

    setServiceStatus('ideal_postcodes', 'healthy');
    return NextResponse.json({ address, provider: 'ideal_postcodes' });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'NOT_FOUND') {
      return apiError('Eircode not found', 404);
    }
    if (message === 'UPSTREAM_ERROR') {
      setServiceStatus('ideal_postcodes', 'down');
      return apiError('Address lookup failed', 502);
    }
    setServiceStatus('ideal_postcodes', 'down');
    return apiError('Address lookup unavailable', 503);
  }
}

export const GET = withRequestId(handler);
