import type {Metadata} from 'next';
import FoundingProBanner from '@/components/home/FoundingProBanner';

export const metadata: Metadata = {
  title: 'Become a Pro | WorkMate',
  description:
    'Join WorkMate as a verified tradesperson. Grow your trade, get paid securely, and reach customers across all 26 counties of Ireland.',
};

export default async function BecomeProviderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  return (
    <>
      <FoundingProBanner locale={locale} />
      {children}
    </>
  );
}
