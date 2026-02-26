"use client";

import {useEffect} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {motion} from 'framer-motion';

import {BrandColumn} from '@/components/auth/BrandColumn';
import {LoginForm} from '@/components/auth/LoginForm';
import {TrustBadges} from '@/components/auth/TrustBadges';
import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {pageContainerVariants} from '@/styles/animations';
import styles from '@/components/auth/login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('logged_out') === '1') {
      return;
    }
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({data}) => {
      if (data.user) {
        router.replace('/profile');
      }
    });
  }, [router, searchParams]);

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
