import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Garda Vetting Management',
  description: 'Manage provider Garda vetting status.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
