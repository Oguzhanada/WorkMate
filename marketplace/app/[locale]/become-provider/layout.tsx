import FoundingProBanner from '@/components/home/FoundingProBanner';

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
