import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Earnings',
  description: 'Track your WorkMate earnings and payouts.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
