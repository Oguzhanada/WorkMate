import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/error-response';
import { eircodeToCounty } from '@/lib/ireland/eircode-county';
import { IRISH_COUNTIES } from '@/lib/ireland/locations';
import { withRequestId } from '@/lib/request-id/middleware';

// Permissive Eircode pattern — 3 alphanumeric + space + 4 alphanumeric
const EIRCODE_RE = /^[A-Z0-9]{3}\s[A-Z0-9]{4}$/i;

function parseIrlSuggestion(suggestion: string) {
  const parts = suggestion.split(', ').map((p) => p.trim());

  let eircode: string | undefined;
  let locality: string | undefined;
  let addrParts: string[];

  const last = parts[parts.length - 1] ?? '';
  if (EIRCODE_RE.test(last)) {
    eircode = last.toUpperCase();
    locality = parts[parts.length - 2]?.trim();
    addrParts = parts.slice(0, parts.length - 2);
  } else {
    addrParts = parts;
  }

  // Map locality to county if it directly matches (e.g. "Cork", "Galway")
  let county: string | undefined;
  if (eircode) {
    const fromCode = eircodeToCounty(eircode);
    if (fromCode && (IRISH_COUNTIES as readonly string[]).includes(fromCode)) {
      county = fromCode;
    }
  }
  if (!county && locality) {
    const match = locality.replace(/^county\s+/i, '').trim();
    if ((IRISH_COUNTIES as readonly string[]).includes(match)) {
      county = match;
    }
  }

  return {
    address_line_1: addrParts[0] ?? '',
    address_line_2: addrParts.slice(1).join(', ') || undefined,
    locality,
    county,
    eircode,
  };
}

export const GET = withRequestId(async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 1) {
    return NextResponse.json({ hits: [], provider: 'none' });
  }

  const provider = process.env.ADDRESS_PROVIDER ?? 'none';
  if (provider !== 'ideal_postcodes') {
    return NextResponse.json({ hits: [], provider: 'none' });
  }

  const apiKey = process.env.IDEAL_POSTCODES_API_KEY;
  if (!apiKey) {
    return apiError('Address autocomplete not configured', 503);
  }

  try {
    const url = `https://api.ideal-postcodes.co.uk/v1/autocomplete/addresses?q=${encodeURIComponent(q)}&context=IRL&api_key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // 5-min cache

    if (!res.ok) {
      return NextResponse.json({ hits: [], provider: 'ideal_postcodes' });
    }

    const data = await res.json() as {
      result: { hits: Array<{ id: string; suggestion: string }> };
    };

    const hits = (data.result?.hits ?? [])
      // Only postal address points (herewe_pap) include Eircodes
      .filter((h) => h.id.startsWith('herewe_pap'))
      .slice(0, 8)
      .map((h) => ({
        id: h.id,
        suggestion: h.suggestion,
        ...parseIrlSuggestion(h.suggestion),
      }));

    return NextResponse.json({ hits, provider: 'ideal_postcodes' });
  } catch {
    return NextResponse.json({ hits: [], provider: 'ideal_postcodes' });
  }
});
