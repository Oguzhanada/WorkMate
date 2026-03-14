"use client";

import {useEffect} from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {motion} from 'framer-motion';

import {BrandColumn} from '@/components/auth/BrandColumn';
import {LoginForm} from '@/components/auth/LoginForm';
import {TrustBadges} from '@/components/auth/TrustBadges';
import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';
import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {pageContainerVariants} from '@/styles/animations';
import styles from '@/components/auth/login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const localeRoot = getLocaleRoot(pathname);

  useEffect(() => {
    if (searchParams.get('logged_out') === '1') {
      return;
    }
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({data}: { data: { session: unknown } }) => {
      if (data.session) {
        router.replace(withLocalePrefix(localeRoot, '/dashboard/customer'));
      }
    });
  }, [localeRoot, router, searchParams]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <motion.div className={styles.split} variants={pageContainerVariants} initial="hidden" animate="visible">
          <BrandColumn />
          <LoginForm />
        </motion.div>
        <TrustBadges />
      </div>
    </main>
  );
}
