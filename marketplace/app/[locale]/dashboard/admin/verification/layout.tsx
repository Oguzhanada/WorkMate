import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verification Queue',
  description: 'Review and verify provider applications.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
