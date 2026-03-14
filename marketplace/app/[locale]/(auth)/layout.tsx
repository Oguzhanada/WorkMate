import type { ReactNode } from 'react';
import { connection } from 'next/server';

/**
 * Auth route group layout.
 *
 * Groups login, sign-up, forgot-password, and reset-password under a common
 * parent. No structural changes — pages retain their own metadata via
 * individual layout.tsx files. This layout exists purely for route organisation.
 */
export default async function AuthGroupLayout({ children }: { children: ReactNode }) {
  await connection();
  return <>{children}</>;
}
