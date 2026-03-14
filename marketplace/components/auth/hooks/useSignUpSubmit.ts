import { FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { withLocalePrefix } from '@/lib/i18n/locale-path';
import { normalizeIrishPhone } from '@/lib/ireland/phone';
import type { AccountRole } from '../RoleSelector';
import { validateByRole } from './useSignUpFormState';
import { type FieldErrors, type SignUpFormData, AUTH_PING_TIMEOUT_MS, AUTH_TIMEOUT_MS, SIGNUP_DRAFT_KEY } from './types';

/* ---------- helpers ---------- */

async function canReachAuthServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !apikey) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_PING_TIMEOUT_MS);
  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey },
      signal: controller.signal,
    });
    return response.ok || response.status === 401;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- hook ---------- */

type UseSignUpSubmitDeps = {
  form: SignUpFormData;
  role: AccountRole;
  cfToken: string;
  intentId: string;
  intentEmail: string;
  localeRoot: string;
  setErrors: (errors: FieldErrors) => void;
  setFormError: (msg: string) => void;
  setSuccess: (msg: string) => void;
  setIsPending: (v: boolean) => void;
  setOauthPending: (v: '' | 'google' | 'facebook') => void;
};

export type UseSignUpSubmitReturn = {
  onSubmit: (event: FormEvent) => Promise<void>;
  signUpWithOAuth: (provider: 'google' | 'facebook') => Promise<void>;
};

export function useSignUpSubmit(deps: UseSignUpSubmitDeps): UseSignUpSubmitReturn {
  const {
    form,
    role,
    cfToken,
    intentId,
    intentEmail,
    localeRoot,
    setErrors,
    setFormError,
    setSuccess,
    setIsPending,
    setOauthPending,
  } = deps;

  const router = useRouter();

  const signUpWithOAuth = useCallback(async (provider: 'google' | 'facebook') => {
    setFormError('');
    setSuccess('');
    setOauthPending(provider);

    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/?welcome=1')}`;

    try {
      const { error } = await Promise.race([
        supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Authentication request timed out. Please try again.')), AUTH_TIMEOUT_MS),
        ),
      ]);

      if (error) {
        setOauthPending('');
        setFormError(error.message);
      }
    } catch (oauthError) {
      const message = oauthError instanceof Error ? oauthError.message : 'OAuth login failed. Please try again.';
      setOauthPending('');
      setFormError(message);
    }
  }, [setFormError, setSuccess, setOauthPending]);

  const onSubmit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setSuccess('');

    const validationErrors = validateByRole(role, form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsPending(true);

    try {
      // Cloudflare Turnstile bot protection check (skipped if site key not configured)
      if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && cfToken) {
        const turnstileRes = await fetch('/api/auth/verify-turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: cfToken }),
        });
        if (!turnstileRes.ok) {
          setFormError('Bot protection check failed. Please complete the security challenge and try again.');
          return;
        }
      }

      const reachable = await canReachAuthServer();
      if (!reachable) {
        setFormError('Cannot reach authentication server. Check VPN/ad blocker and try again.');
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/?welcome=1`;

      const { error } = await Promise.race([
        supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: form.fullName,
              username: form.username.trim().toLowerCase(),
              phone: normalizeIrishPhone(form.phone),
              city: role === 'provider' ? form.city : '',
              county: role === 'provider' ? form.county : '',
              eircode: role === 'provider' ? form.eircode : '',
              address_line_1: role === 'provider' ? form.address1 : '',
              address_line_2: role === 'provider' ? form.address2 : '',
              locality: role === 'provider' ? form.city : '',
              role,
              referral_code: form.referralCode.trim().toUpperCase() || undefined,
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Authentication request timed out. Please try again.')), AUTH_TIMEOUT_MS),
        ),
      ]);

      if (error) {
        setFormError('Something went wrong. Please try again.');
        return;
      }

      try {
        window.sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
      } catch { /* ignore */ }

      const nextQuery = intentId
        ? `?intent=${encodeURIComponent(intentId)}${intentEmail ? `&email=${encodeURIComponent(intentEmail)}` : ''}`
        : '';
      let remaining = 5;
      setSuccess(`Account created! Check your email to verify. Redirecting in ${remaining}s...`);
      const countdownTimer = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(countdownTimer);
          router.push(withLocalePrefix(localeRoot, '/login') + nextQuery);
        } else {
          setSuccess(`Account created! Check your email to verify. Redirecting in ${remaining}s...`);
        }
      }, 1000);
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setIsPending(false);
    }
  }, [form, role, cfToken, intentId, intentEmail, localeRoot, router, setErrors, setFormError, setSuccess, setIsPending]);

  return { onSubmit, signUpWithOAuth };
}
