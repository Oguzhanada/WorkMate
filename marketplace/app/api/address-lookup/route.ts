import { NextRequest, NextResponse } from 'next/server';
import { isValidEircode, normalizeEircode } from '@/lib/eircode';

async function lookupIdealPostcodes(eircode: string) {
  const key = process.env.IDEAL_POSTCODES_API_KEY;
  const url = `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(eircode)}?api_key=${key}`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Ideal Postcodes lookup failed');
  const json = await response.json();
  const first = json?.result?.[0];
  if (!first) return null;
  return {
    address_line_1: first.line_1,
    address_line_2: first.line_2,
    locality: first.post_town,
    county: first.county,
    eircode,
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('eircode') || '';
  const eircode = normalizeEircode(query);

  if (!isValidEircode(eircode)) {
    return NextResponse.json({ error: 'Invalid Eircode format' }, { status: 400 });
  }

  try {
    const address = await lookupIdealPostcodes(eircode);
    if (!address) {
      return NextResponse.json({ error: 'No matching address found' }, { status: 404 });
    }
    return NextResponse.json({ address });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
