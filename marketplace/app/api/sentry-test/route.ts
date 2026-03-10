import { NextResponse } from 'next/server';

// Temporary route to verify Sentry is capturing errors.
// DELETE THIS FILE after confirming Sentry works.
export async function GET() {
  throw new Error('Sentry test error — if you see this in Sentry, it works!');
  return NextResponse.json({ ok: true });
}
