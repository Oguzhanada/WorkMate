import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Founding Pro Programme',
  description: 'Join as a Founding Pro and get exclusive benefits on WorkMate.',
};

export default function FoundingProLayout({ children }: { children: React.ReactNode }) {
  return children;
}
