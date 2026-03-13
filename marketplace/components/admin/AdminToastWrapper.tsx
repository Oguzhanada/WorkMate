'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';

/**
 * Client-side wrapper that provides Toast context to the entire admin section.
 * Used in the admin layout.tsx (server component) by wrapping children here.
 */
export default function AdminToastWrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
