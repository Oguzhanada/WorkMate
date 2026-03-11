import { NextRequest, NextResponse } from 'next/server';
import { isValidEircode, normalizeEircode } from '@/lib/ireland/eircode';
import { addressLookupQuerySchema } from '@/lib/validation/api';
import { apiError } from '@/lib/api/error-response';

export async function GET(request: NextRequest) {
  const parsed = addressLookupQuerySchema.safeParse({
    eircode: request.nextUrl.searchParams.get('eircode') ?? '',
  });

  if (!parsed.success) {
    return apiError('Invalid request query', 400);
  }

  const eircode = normalizeEircode(parsed.data.eircode);
  const provider = process.env.ADDRESS_PROVIDER ?? 'none';

  if (!isValidEircode(eircode)) {
    return apiError('Invalid Eircode format', 400);
  }

  // Format-only validation (no API key required)
  if (provider !== 'ideal_postcodes') {
    return NextResponse.json({
      address: { eircode, is_format_valid: true },
      provider: 'format_only',
    });
  }

  // Ideal Postcodes live lookup
  const apiKey = process.env.IDEAL_POSTCODES_API_KEY;
  if (!apiKey) {
    return apiError('Address lookup not configured', 503);
  }

  try {
    const res = await fetch(
      `https://api.ideal-postcodes.co.uk/v1/eircodes/${encodeURIComponent(eircode)}?api_key=${apiKey}`,
      { next: { revalidate: 86400 } } // cache 24 h — Eircodes don't change
    );

    if (res.status === 404) {
      return apiError('Eircode not found', 404);
    }

    if (!res.ok) {
      return apiError('Address lookup failed', 502);
    }

    const data = await res.json();
    const result = data.result ?? {};

    return NextResponse.json({
      address: {
        eircode,
        is_format_valid: true,
        line_1: result.line_1 ?? null,
        line_2: result.line_2 ?? null,
        post_town: result.post_town ?? null,
        county: result.county ?? null,
        country: result.country ?? 'Ireland',
      },
      provider: 'ideal_postcodes',
    });
  } catch {
    return apiError('Address lookup unavailable', 503);
  }
}
