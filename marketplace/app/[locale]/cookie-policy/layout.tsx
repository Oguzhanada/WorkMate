import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How WorkMate uses cookies on our platform.',
};

export default function CookiePolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
