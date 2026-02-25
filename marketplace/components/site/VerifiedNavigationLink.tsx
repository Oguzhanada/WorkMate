"use client";

import Link from 'next/link';
import {MouseEvent, ReactNode, useState} from 'react';
import {useRouter} from 'next/navigation';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
  requireIdentity?: boolean;
};

export default function VerifiedNavigationLink({
  href,
  className,
  children,
  requireIdentity = true
}: Props) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  const onClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (!requireIdentity || isChecking) return;
    event.preventDefault();
    setIsChecking(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: {user}
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(href);
        return;
      }

      const [{data: profile}, {data: idDocument}] = await Promise.all([
        supabase
          .from('profiles')
          .select('id_verification_status')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('pro_documents')
          .select('id')
          .eq('profile_id', user.id)
          .eq('document_type', 'id_verification')
          .limit(1)
          .maybeSingle()
      ]);

      const hasIdDocument = Boolean(idDocument?.id);
      const isApproved = profile?.id_verification_status === 'approved';

      if (hasIdDocument && isApproved) {
        router.push(href);
        return;
      }

      router.push('/profile?message=identity_required');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
