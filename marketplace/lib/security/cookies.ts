import 'server-only';

import {cookies} from 'next/headers';

export async function setAuthCookie(subject: string) {
  const cookieStore = await cookies();

  cookieStore.set('marketplace_auth', subject, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}
