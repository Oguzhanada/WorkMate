"use client";

import Link from 'next/link';
import {FormEvent, useMemo, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {motion} from 'framer-motion';
import {AtSign, Eye, EyeOff, Lock} from 'lucide-react';
import {useTranslations} from 'next-intl';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';
import {formItemVariants, formListVariants, rightColumnVariants} from '@/styles/animations';
import {SecurityDropdown} from '@/components/auth/SecurityDropdown';
import {SocialButtons} from '@/components/auth/SocialButtons';
import Button from '@/components/ui/Button';
import styles from './login.module.css';

type FieldErrors = {
  identifier?: string;
  password?: string;
};

function validateIdentifier(value: string): string | undefined {
  if (!value.trim()) return 'Email or username is required.';
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
  const pathname = usePathname() || '/';
  const t = useTranslations('login');

  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [oauthPending, setOauthPending] = useState<'' | 'google' | 'facebook'>('');
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  const hasAnyLoading = isPending || Boolean(oauthPending);

  const localeRoot = useMemo(() => getLocaleRoot(pathname), [pathname]);

  const validateAll = (): boolean => {
    const nextErrors: FieldErrors = {
      identifier: validateIdentifier(identifier),
      password: validatePassword(password)
    };
    setFieldErrors(nextErrors);
    return !nextErrors.identifier && !nextErrors.password;
  };

  const resolveEmail = async (value: string): Promise<string | null> => {
    if (value.includes('@')) return value;
    try {
      const res = await fetch(`/api/auth/resolve-username?identifier=${encodeURIComponent(value)}`);
      if (!res.ok) return null;
      const data = await res.json() as { email?: string };
      return data.email ?? null;
    } catch {
      return null;
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!validateAll()) return;

    setIsPending(true);
    try {
      const trimmed = identifier.trim();
      const email = await resolveEmail(trimmed);

      if (!email) {
        setFormError('Username not found. Please check and try again.');
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const {data: signInData, error} = await supabase.auth.signInWithPassword({email, password});

      if (error) {
        setFormError(error.message);
        return;
      }

      // Honour ?next= param set by middleware (protected page redirect)
      const nextParam = new URLSearchParams(window.location.search).get('next');
      if (nextParam && nextParam.startsWith('/')) {
        setSuccessMessage(t('success'));
        router.replace(nextParam);
        router.refresh();
        return;
      }

      // Role-aware default redirect
      const userId = signInData.user?.id;
      let dashboardPath = '/dashboard/customer';
      if (userId) {
        const {data: rolesData} = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
        const roles = (rolesData ?? []).map((r) => r.role as string);
        if (roles.includes('admin')) {
          dashboardPath = '/dashboard/admin';
        } else if (roles.includes('verified_pro')) {
          dashboardPath = '/dashboard/pro';
        }
      }

      setSuccessMessage(t('success'));
      router.replace(withLocalePrefix(localeRoot, dashboardPath));
      router.refresh();
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
            <label htmlFor="login-identifier">Email or username</label>
            <div className={styles.inputWrap}>
              <AtSign size={17} aria-hidden="true" />
              <input
                id="login-identifier"
                name="identifier"
                type="text"
                value={identifier}
                placeholder="your@email.com or username"
                autoComplete="username"
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  if (fieldErrors.identifier) {
                    setFieldErrors((prev) => ({...prev, identifier: validateIdentifier(event.target.value)}));
                  }
                }}
                onBlur={() => setFieldErrors((prev) => ({...prev, identifier: validateIdentifier(identifier)}))}
              />
            </div>
            {fieldErrors.identifier ? <p className={styles.fieldError}>{fieldErrors.identifier}</p> : null}
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
              <Button
                variant="ghost"
                size="sm"
                className={styles.togglePassword}
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </Button>
            </div>
            {fieldErrors.password ? <p className={styles.fieldError}>{fieldErrors.password}</p> : null}
          </motion.div>

          <motion.div variants={formItemVariants} className={styles.formActions}>
            <Link className={styles.forgotLink} href={withLocalePrefix(localeRoot, '/forgot-password')}>
              {t('forgotLink')}
            </Link>
          </motion.div>

          <motion.div variants={formItemVariants}>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              className={styles.primaryButton}
              disabled={hasAnyLoading}
              loading={isPending}
            >
              {isPending ? 'Logging in...' : 'Login'}
            </Button>
          </motion.div>
        </form>

        <motion.p variants={formItemVariants} className={styles.linkRow}>
          Don&apos;t have an account? <Link href={withLocalePrefix(localeRoot, '/sign-up')}>Sign up</Link>
        </motion.p>

        <motion.div variants={formItemVariants}>
          <SecurityDropdown isOpen={isSecurityOpen} onToggle={() => setIsSecurityOpen((current) => !current)} />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
