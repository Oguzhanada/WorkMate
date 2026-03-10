"use client";

import {Loader2} from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './login.module.css';

type OAuthProvider = 'google' | 'facebook';

type SocialButtonsProps = {
  pendingProvider: OAuthProvider | '';
  onLogin: (provider: OAuthProvider) => void;
  inline?: boolean;
};

export function SocialButtons({pendingProvider, onLogin, inline = false}: SocialButtonsProps) {
  const isLoading = Boolean(pendingProvider);

  return (
    <div className={`${styles.socialGroup} ${inline ? styles.socialInline : ''}`}>
      <Button
        variant="outline"
        className={`${styles.socialButton} ${styles.google}`}
        onClick={() => onLogin('google')}
        disabled={isLoading}
        leftIcon={pendingProvider === 'google' ? <Loader2 size={18} className={styles.spinner} /> : <span>G</span>}
      >
        Continue with Google
      </Button>

      <Button
        variant="outline"
        className={`${styles.socialButton} ${styles.facebook}`}
        onClick={() => onLogin('facebook')}
        disabled={isLoading}
        leftIcon={pendingProvider === 'facebook' ? <Loader2 size={18} className={styles.spinner} /> : <span>f</span>}
      >
        Continue with Facebook
      </Button>
    </div>
  );
}
