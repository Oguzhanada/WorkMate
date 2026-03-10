import FoundingProBanner from '@/components/home/FoundingProBanner';

export default function BecomeProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FoundingProBanner />
      {children}
    </>
  );
}
