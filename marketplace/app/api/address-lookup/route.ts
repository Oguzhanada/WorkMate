import { NextRequest, NextResponse } from 'next/server';
import { isValidEircode, normalizeEircode } from '@/lib/ireland/eircode';
import { addressLookupQuerySchema } from '@/lib/validation/api';

export async function GET(request: NextRequest) {
  const parsed = addressLookupQuerySchema.safeParse({
    eircode: request.nextUrl.searchParams.get('eircode') ?? '',
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request query' }, { status: 400 });
  }

  const eircode = normalizeEircode(parsed.data.eircode);
  const provider = process.env.ADDRESS_PROVIDER ?? 'none';

  if (!isValidEircode(eircode)) {
    return NextResponse.json({ error: 'Invalid Eircode format' }, { status: 400 });
  }

  return NextResponse.json({
    address: {
      eircode,
      is_format_valid: true
    },
    provider,
  });
}
