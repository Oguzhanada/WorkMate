import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Providers',
  description: 'Search for trusted service providers across Ireland.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
