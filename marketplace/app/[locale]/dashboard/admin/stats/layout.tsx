import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Statistics',
  description: 'WorkMate platform usage and performance statistics.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
