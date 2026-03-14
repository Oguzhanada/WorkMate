import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import { isValidIrishPhone } from '@/lib/ireland/phone';
import { PasswordChecks } from '../PasswordStrength';
import type { AccountRole } from '../RoleSelector';
import {
  type FieldErrors,
  type EircodeStatus,
  type SignUpDraft,
  type SignUpFormData,
  INITIAL_FORM,
  SIGNUP_DRAFT_KEY,
} from './types';

/* ---------- Zod schemas ---------- */

const usernameRegex = /^[a-z0-9_]{3,20}$/;

const commonSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(20, 'Username must be 20 characters or fewer.')
    .regex(usernameRegex, 'Only lowercase letters, numbers, and underscores allowed.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(1, 'Phone is required.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[a-z]/, 'Password needs at least one lowercase letter.')
    .regex(/[A-Z]/, 'Password needs at least one uppercase letter.')
    .regex(/[0-9]/, 'Password needs at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password needs at least one special character.'),
  confirmPassword: z.string(),
  identityConsent: z.boolean().refine((v) => v === true, { message: 'You must accept the terms to continue.' }),
});

const providerOnlySchema = z.object({
  address1: z.string().min(3, 'Address line 1 is required.'),
  address2: z.string().optional(),
  county: z.string().min(1, 'Please choose a county.'),
  city: z.string().min(1, 'Please choose a city.'),
  eircode: z.string().min(3, 'Please enter your Eircode.'),
});

/* ---------- helpers ---------- */

function validatePhone(masked: string) {
  if (!isValidIrishPhone(masked)) {
    return 'Use a valid Irish (+353) or UK (+44 7xxx) mobile number.';
  }
  return undefined;
}

function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function validateByRole(role: AccountRole, form: SignUpFormData) {
  const common = commonSchema
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match.',
      path: ['confirmPassword'],
    })
    .safeParse(form);

  const errors: FieldErrors = {};
  if (!common.success) {
    for (const issue of common.error.issues) {
      const field = issue.path[0] as keyof SignUpFormData;
      if (field && !errors[field]) {
        errors[field] = issue.message;
      }
    }
  }

  const phoneError = validatePhone(form.phone);
  if (phoneError) {
    errors.phone = phoneError;
  }

  if (role === 'provider') {
    const provider = providerOnlySchema.safeParse(form);
    if (!provider.success) {
      for (const issue of provider.error.issues) {
        const field = issue.path[0] as keyof SignUpFormData;
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }
    }
    // eircode validated automatically via debounced lookup; no manual button needed
  }

  return errors;
}

/* ---------- lazy initializers ---------- */

type DraftInit = {
  role: AccountRole;
  form: SignUpFormData;
  eircodeStatus: EircodeStatus;
  intentId: string;
  intentEmail: string;
};

function readInitialState(): DraftInit {
  let role: AccountRole = 'customer';
  let form = INITIAL_FORM;
  let eircodeStatus: EircodeStatus = 'idle';
  let intentId = '';
  let intentEmail = '';

  // Restore draft from sessionStorage
  try {
    if (typeof window !== 'undefined') {
      const raw = window.sessionStorage.getItem(SIGNUP_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SignUpDraft>;
        if (parsed?.role === 'customer' || parsed?.role === 'provider') {
          role = parsed.role;
        }
        if (parsed?.form && typeof parsed.form === 'object') {
          form = { ...INITIAL_FORM, ...parsed.form };
        }
        if (
          parsed?.eircodeStatus === 'idle' ||
          parsed?.eircodeStatus === 'validating' ||
          parsed?.eircodeStatus === 'valid' ||
          parsed?.eircodeStatus === 'invalid'
        ) {
          eircodeStatus = parsed.eircodeStatus;
        }
      }

      // Read intent params from URL
      const params = new URLSearchParams(window.location.search);
      intentId = params.get('intent') ?? '';
      intentEmail = params.get('email') ?? '';
      if (intentEmail && !form.email) {
        form = { ...form, email: intentEmail };
      }
    }
  } catch { /* ignore */ }

  return { role, form, eircodeStatus, intentId, intentEmail };
}

/* ---------- hook ---------- */

export type UseSignUpFormStateReturn = {
  form: SignUpFormData;
  setForm: Dispatch<SetStateAction<SignUpFormData>>;
  errors: FieldErrors;
  setErrors: Dispatch<SetStateAction<FieldErrors>>;
  formError: string;
  setFormError: Dispatch<SetStateAction<string>>;
  success: string;
  setSuccess: Dispatch<SetStateAction<string>>;
  isPending: boolean;
  setIsPending: Dispatch<SetStateAction<boolean>>;
  role: AccountRole;
  setRole: Dispatch<SetStateAction<AccountRole>>;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  showConfirmPassword: boolean;
  setShowConfirmPassword: Dispatch<SetStateAction<boolean>>;
  isSecurityOpen: boolean;
  setIsSecurityOpen: Dispatch<SetStateAction<boolean>>;
  intentId: string;
  intentEmail: string;
  eircodeStatus: EircodeStatus;
  setEircodeStatus: Dispatch<SetStateAction<EircodeStatus>>;
  passwordChecks: PasswordChecks;
  updateField: <K extends keyof SignUpFormData>(key: K, value: SignUpFormData[K]) => void;
  cfToken: string;
  handleTurnstileVerify: (token: string) => void;
  handleTurnstileExpire: () => void;
  oauthPending: '' | 'google' | 'facebook';
  setOauthPending: Dispatch<SetStateAction<'' | 'google' | 'facebook'>>;
  loading: boolean;
};

export function useSignUpFormState(): UseSignUpFormStateReturn {
  // Lazy initializer reads sessionStorage + URL params once on mount
  const [init] = useState(readInitialState);

  const [role, setRole] = useState<AccountRole>(init.role);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  const [form, setForm] = useState<SignUpFormData>(init.form);

  const [cfToken, setCfToken] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [oauthPending, setOauthPending] = useState<'' | 'google' | 'facebook'>('');
  const [eircodeStatus, setEircodeStatus] = useState<EircodeStatus>(init.eircodeStatus);

  const handleTurnstileVerify = useCallback((token: string) => setCfToken(token), []);
  const handleTurnstileExpire = useCallback(() => setCfToken(''), []);

  /* Persist draft to sessionStorage */
  useEffect(() => {
    try {
      const draft: SignUpDraft = { role, form, eircodeStatus };
      window.sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft));
    } catch { /* ignore */ }
  }, [role, form, eircodeStatus]);

  const passwordChecks = useMemo(() => getPasswordChecks(form.password), [form.password]);

  const updateField = useCallback(<K extends keyof SignUpFormData>(key: K, value: SignUpFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (prev[key]) return { ...prev, [key]: undefined };
      return prev;
    });
    if (key === 'eircode') {
      setEircodeStatus('idle');
    }
  }, []);

  const loading = isPending || Boolean(oauthPending);

  return {
    form,
    setForm,
    errors,
    setErrors,
    formError,
    setFormError,
    success,
    setSuccess,
    isPending,
    setIsPending,
    role,
    setRole,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isSecurityOpen,
    setIsSecurityOpen,
    intentId: init.intentId,
    intentEmail: init.intentEmail,
    eircodeStatus,
    setEircodeStatus,
    passwordChecks,
    updateField,
    cfToken,
    handleTurnstileVerify,
    handleTurnstileExpire,
    oauthPending,
    setOauthPending,
    loading,
  };
}
