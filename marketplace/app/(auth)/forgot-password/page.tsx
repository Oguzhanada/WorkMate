"use client";

import {motion} from 'framer-motion';

import {BrandColumn} from '@/components/auth/BrandColumn';
import {ForgotPasswordForm} from '@/components/auth/ForgotPasswordForm';
import {TrustBadges} from '@/components/auth/TrustBadges';
import {pageContainerVariants} from '@/styles/animations';
import styles from '@/components/auth/login.module.css';

export default function ForgotPasswordPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <motion.div className={styles.split} variants={pageContainerVariants} initial="hidden" animate="visible">
          <BrandColumn />
          <ForgotPasswordForm />
        </motion.div>
        <TrustBadges />
      </div>
    </main>
  );
}
