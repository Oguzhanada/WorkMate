"use client";

import Link from 'next/link';
import {FormEvent, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {motion} from 'framer-motion';
import {Eye, EyeOff, Loader2, Lock, Mail} from 'lucide-react';
import {useTranslations} from 'next-intl';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {formItemVariants, formListVariants, rightColumnVariants} from '@/styles/animations';
import {SecurityDropdown} from '@/components/auth/SecurityDropdown';
import {SocialButtons} from '@/components/auth/SocialButtons';
import styles from './login.module.css';

type FieldErrors = {
  email?: string;
  password?: string;
};

const AUTH_TIMEOUT_MS = 15000;

function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email is required.';
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return 'Enter a valid email address.';
  }
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password.trim()) {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return undefined;
}

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [oauthPending, setOauthPending] = useState<'' | 'google' | 'facebook'>('');
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  const hasAnyLoading = isPending || Boolean(oauthPending);

  const sanitizedEmail = useMemo(() => email.trim(), [email]);

  const validateAll = (): boolean => {
    const nextErrors: FieldErrors = {
      email: validateEmail(sanitizedEmail),
      password: validatePassword(password)
    };

    setFieldErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!validateAll()) {
      return;
    }

    setIsPending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const {error} = await Promise.race([
        supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Authentication request timed out. Please try again.')), AUTH_TIMEOUT_MS)
        )
      ]);

      if (error) {
        setFormError(error.message);
        return;
      }

      setSuccessMessage(t('success'));
      setTimeout(() => {
        router.push('/?welcome=1');
        router.refresh();
      }, 550);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Login failed. Please try again.';
      setFormError(message);
    } finally {
      setIsPending(false);
    }
  };

  const loginWithOAuth = async (provider: 'google' | 'facebook') => {
    setFormError('');
    setSuccessMessage('');
    setOauthPending(provider);

    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/?welcome=1`;
    const {error} = await supabase.auth.signInWithOAuth({
      provider,
      options: {redirectTo}
    });

    if (error) {
      setOauthPending('');
      setFormError(error.message);
    }
  };

  return (
    <motion.section
      className={`${styles.panel} ${styles.formPanel}`}
      variants={rightColumnVariants}
      initial="hidden"
      animate="visible"
      aria-label="Login form"
    >
      <h2 className={styles.formTitle}>Welcome back!</h2>
      <p className={styles.formSubtitle}>Log in to continue</p>

      {successMessage ? <div className={styles.toast}>{successMessage}</div> : null}
      {formError ? <div className={styles.error}>{formError}</div> : null}

      <motion.div variants={formListVariants} initial="hidden" animate="visible">
        <motion.div variants={formItemVariants}>
          <SocialButtons pendingProvider={oauthPending} onLogin={loginWithOAuth} />
        </motion.div>

        <motion.div variants={formItemVariants} className={styles.separator}>
          <span>or continue with</span>
        </motion.div>

        <form onSubmit={onSubmit} noValidate>
          <motion.div variants={formItemVariants} className={styles.field}>
            <label htmlFor="login-email">Email</label>
            <div className={styles.inputWrap}>
              <Mail size={17} aria-hidden="true" />
              <input
                id="login-email"
                name="email"
                type="email"
                value={email}
                placeholder="your@email.com"
                autoComplete="email"
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({...prev, email: validateEmail(event.target.value.trim())}));
                  }
                }}
                onBlur={() => setFieldErrors((prev) => ({...prev, email: validateEmail(sanitizedEmail)}))}
              />
            </div>
            {fieldErrors.email ? <p className={styles.fieldError}>{fieldErrors.email}</p> : null}
          </motion.div>

          <motion.div variants={formItemVariants} className={styles.field}>
            <label htmlFor="login-password">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={17} aria-hidden="true" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="••••••••••"
                autoComplete="current-password"
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({...prev, password: validatePassword(event.target.value)}));
                  }
                }}
                onBlur={() => setFieldErrors((prev) => ({...prev, password: validatePassword(password)}))}
              />
              <button
                className={styles.togglePassword}
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {fieldErrors.password ? <p className={styles.fieldError}>{fieldErrors.password}</p> : null}
          </motion.div>

          <motion.div variants={formItemVariants} className={styles.formActions}>
            <Link className={styles.forgotLink} href="/forgot-password">
              {t('forgotLink')}
            </Link>
          </motion.div>

          <motion.div variants={formItemVariants}>
            <button type="submit" className={styles.primaryButton} disabled={hasAnyLoading}>
              {isPending ? (
                <>
                  <Loader2 size={18} className={styles.spinner} /> Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </motion.div>
        </form>

        <motion.p variants={formItemVariants} className={styles.linkRow}>
          Don&apos;t have an account? <Link href="/sign-up">Sign up</Link>
        </motion.p>

        <motion.div variants={formItemVariants}>
          <SecurityDropdown isOpen={isSecurityOpen} onToggle={() => setIsSecurityOpen((current) => !current)} />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
