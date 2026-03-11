import type { ReactNode } from 'react';

/**
 * Auth route group layout.
 *
 * Groups login, sign-up, forgot-password, and reset-password under a common
 * parent. No structural changes — pages retain their own metadata via
 * individual layout.tsx files. This layout exists purely for route organisation.
 */
export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
