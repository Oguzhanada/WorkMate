"use client";

import {useEffect} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {motion} from 'framer-motion';

import {BrandColumn} from '@/components/auth/BrandColumn';
import {SignUpForm} from '@/components/auth/SignUpForm';
import {TrustBadges} from '@/components/auth/TrustBadges';
import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';
import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {pageContainerVariants} from '@/styles/animations';
import styles from '@/components/auth/login.module.css';

export default function SignupPage() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({data}) => {
      if (data.user) {
        router.replace(withLocalePrefix(localeRoot, '/dashboard/customer'));
      }
    });
  }, [localeRoot, router]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <motion.div className={styles.split} variants={pageContainerVariants} initial="hidden" animate="visible">
          <BrandColumn />
          <SignUpForm />
        </motion.div>
        <TrustBadges />
      </div>
    </main>
  );
}
