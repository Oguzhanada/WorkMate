import { redirect } from 'next/navigation';

export default function PrivacyPolicyRedirect({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/privacy`);
}
