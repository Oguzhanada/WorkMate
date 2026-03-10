import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GDPR Management',
  description: 'GDPR data deletion and privacy management.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
