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

  return NextResponse.json({
    address: {
      eircode,
      is_format_valid: true
    },
    provider,
  });
}
