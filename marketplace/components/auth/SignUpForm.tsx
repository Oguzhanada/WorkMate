"use client";

import Link from 'next/link';
import {FormEvent, useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {motion} from 'framer-motion';
import {
  CheckCircle2,
  CircleX,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MapPin,
  Phone,
  UploadCloud,
  UserRound
} from 'lucide-react';
import {z} from 'zod';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {getCitiesByCounty} from '@/lib/ireland-locations';
import {isValidIrishPhone, normalizeIrishPhone} from '@/lib/validation/phone';
import {formItemVariants, formListVariants, rightColumnVariants} from '@/styles/animations';
import {IdentityConsent} from './IdentityConsent';
import {PasswordChecks, PasswordStrength} from './PasswordStrength';
import {RoleSelector, AccountRole} from './RoleSelector';
import {SecurityDropdown} from './SecurityDropdown';
import {SocialButtons} from './SocialButtons';
import styles from './login.module.css';

const counties26 = [
  'Carlow',
  'Cavan',
  'Clare',
  'Cork',
  'Donegal',
  'Dublin',
  'Galway',
  'Kerry',
  'Kildare',
  'Kilkenny',
  'Laois',
  'Leitrim',
  'Limerick',
  'Longford',
  'Louth',
  'Mayo',
  'Meath',
  'Monaghan',
  'Offaly',
  'Roscommon',
  'Sligo',
  'Tipperary',
  'Waterford',
  'Westmeath',
  'Wexford',
  'Wicklow'
] as const;

const prioritizedCounties = ['Dublin', 'Cork', 'Galway'] as const;
const orderedCounties = [
  ...prioritizedCounties,
  ...counties26.filter((c) => !prioritizedCounties.includes(c as (typeof prioritizedCounties)[number]))
].sort((a, b) => {
  const ai = prioritizedCounties.indexOf(a as (typeof prioritizedCounties)[number]);
  const bi = prioritizedCounties.indexOf(b as (typeof prioritizedCounties)[number]);
  if (ai !== -1 || bi !== -1) {
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  }
  return a.localeCompare(b);
});

const eircodeRegex = /^[A-Z0-9]{3} [A-Z0-9]{4}$/;

const commonSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
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
  identityConsent: z.boolean().refine((value) => value === true, {
    message: 'You must accept identity verification consent.'
  })
});

const providerOnlySchema = z.object({
  address1: z.string().min(3, 'Address line 1 is required.'),
  address2: z.string().optional(),
  county: z.string().min(1, 'Please choose a county.'),
  city: z.string().min(1, 'Please choose a city.'),
  eircode: z.string().regex(eircodeRegex, 'Use a valid Eircode format (e.g. D02 23B5).')
});

type SignUpFormData = {
  fullName: string;
  phone: string;
  email: string;
  county: string;
  city: string;
  eircode: string;
  address1: string;
  address2: string;
  password: string;
  confirmPassword: string;
  identityConsent: boolean;
};

type FieldErrors = Partial<Record<keyof SignUpFormData | 'idDocument' | 'providerDocument', string>>;

type EircodeStatus = 'idle' | 'validating' | 'valid' | 'invalid';

const AUTH_TIMEOUT_MS = 15000;
const AUTH_PING_TIMEOUT_MS = 5000;

async function canReachAuthServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !apikey) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_PING_TIMEOUT_MS);
  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      headers: {apikey},
      signal: controller.signal
    });
    return response.ok || response.status === 401;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeEircode(value: string) {
  const compact = value.toUpperCase().replace(/\s+/g, '');
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, 3)} ${compact.slice(3, 7)}`;
}

function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
}

function toRawIrishNumber(masked: string) {
  return masked.replace(/\D/g, '');
}

function formatIrishPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  const local = digits.startsWith('353') ? digits.slice(3) : digits;
  const maxLocal = local.slice(0, 9);

  const p1 = maxLocal.slice(0, 2);
  const p2 = maxLocal.slice(2, 5);
  const p3 = maxLocal.slice(5, 9);

  let output = '+353';
  if (p1) output += ` ${p1}`;
  if (p2) output += ` ${p2}`;
  if (p3) output += ` ${p3}`;

  return output;
}

function validatePhone(masked: string) {
  if (!isValidIrishPhone(masked)) {
    return 'Use a valid Irish mobile number: 830446082, 0830446082, or +353830446082.';
  }
  return undefined;
}

function validateByRole(role: AccountRole, form: SignUpFormData, eircodeStatus: EircodeStatus) {
  const common = commonSchema
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match.',
      path: ['confirmPassword']
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
    if (eircodeStatus !== 'valid') {
      errors.eircode = 'Please validate your Eircode first.';
    }
  }

  return errors;
}

export function SignUpForm() {
  const router = useRouter();
  const [intentId, setIntentId] = useState('');
  const [intentEmail, setIntentEmail] = useState('');

  const [role, setRole] = useState<AccountRole>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  const [form, setForm] = useState<SignUpFormData>({
    fullName: '',
    phone: '+353',
    city: '',
    county: '',
    email: '',
    eircode: '',
    address1: '',
    address2: '',
    password: '',
    confirmPassword: '',
    identityConsent: false
  });

  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [providerDocument, setProviderDocument] = useState<File | null>(null);
  const [countyQuery, setCountyQuery] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [oauthPending, setOauthPending] = useState<'' | 'google' | 'facebook'>('');
  const [eircodeStatus, setEircodeStatus] = useState<EircodeStatus>('idle');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextIntentId = params.get('intent') ?? '';
    const nextIntentEmail = params.get('email') ?? '';
    setIntentId(nextIntentId);
    setIntentEmail(nextIntentEmail);
    if (nextIntentEmail) {
      setForm((prev) => ({...prev, email: prev.email || nextIntentEmail}));
    }
  }, []);

  const passwordChecks = useMemo(() => getPasswordChecks(form.password), [form.password]);

  const cityOptions = useMemo(() => {
    if (!form.county) return [] as string[];
    const fromCounty = getCitiesByCounty(form.county);
    if (fromCounty.length > 0) return fromCounty;
    return [`${form.county} Town`, `${form.county} City`];
  }, [form.county]);

  const filteredCounties = useMemo(() => {
    if (!countyQuery.trim()) return orderedCounties;
    const q = countyQuery.toLowerCase();
    return orderedCounties.filter((county) => county.toLowerCase().includes(q));
  }, [countyQuery]);

  const updateField = <K extends keyof SignUpFormData>(key: K, value: SignUpFormData[K]) => {
    setForm((prev) => ({...prev, [key]: value}));
    if (errors[key]) {
      setErrors((prev) => ({...prev, [key]: undefined}));
    }
    if (key === 'eircode') {
      setEircodeStatus('idle');
    }
  };

  const handleAddressLookup = async () => {
    const parsedEircode = normalizeEircode(form.eircode);
    setFormError('');

    if (!eircodeRegex.test(parsedEircode)) {
      setEircodeStatus('invalid');
      setErrors((prev) => ({...prev, eircode: 'Use a valid Eircode format (e.g. D02 23B5).'}));
      return;
    }

    setEircodeStatus('validating');

    try {
      const response = await fetch(`/api/address-lookup?eircode=${encodeURIComponent(parsedEircode)}`);
      if (response.ok) {
        setEircodeStatus('valid');
        setSuccess('✅ Valid Eircode');
        setErrors((prev) => ({...prev, eircode: undefined}));
      } else {
        setEircodeStatus('invalid');
        setErrors((prev) => ({...prev, eircode: '❌ Invalid Eircode'}));
      }
    } catch {
      setEircodeStatus('invalid');
      setErrors((prev) => ({...prev, eircode: '❌ Invalid Eircode'}));
    }
  };

  const signUpWithOAuth = async (provider: 'google' | 'facebook') => {
    setFormError('');
    setSuccess('');
    setOauthPending(provider);

    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/?welcome=1')}`;

    try {
      const {error} = await Promise.race([
        supabase.auth.signInWithOAuth({
          provider,
          options: {redirectTo}
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Authentication request timed out. Please try again.')), AUTH_TIMEOUT_MS)
        )
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
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setSuccess('');

    const validationErrors = validateByRole(role, form, eircodeStatus);
    if (!idDocument) {
      validationErrors.idDocument = 'ID document is required.';
    }
    if (role === 'provider' && !providerDocument) {
      validationErrors.providerDocument = 'Professional proof document is required.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsPending(true);

    try {
      const reachable = await canReachAuthServer();
      if (!reachable) {
        setFormError('Cannot reach authentication server. Check VPN/ad blocker and try again.');
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/?welcome=1`;

      const {error} = await Promise.race([
        supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: form.fullName,
              phone: normalizeIrishPhone(form.phone),
              city: role === 'provider' ? form.city : '',
              county: role === 'provider' ? form.county : '',
              eircode: role === 'provider' ? form.eircode : '',
              address_line_1: role === 'provider' ? form.address1 : '',
              address_line_2: role === 'provider' ? form.address2 : '',
              locality: role === 'provider' ? form.city : '',
              role,
              id_document_name: idDocument?.name,
              provider_document_name: providerDocument?.name ?? ''
            }
          }
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Authentication request timed out. Please try again.')), AUTH_TIMEOUT_MS)
        )
      ]);

      if (error) {
        setFormError('❌ Something went wrong. Please try again.');
        return;
      }

      setSuccess('🎉 Account created! Check your email to verify. Redirecting to login...');
      setTimeout(() => {
        const nextQuery = intentId
          ? `?intent=${encodeURIComponent(intentId)}${intentEmail ? `&email=${encodeURIComponent(intentEmail)}` : ''}`
          : '';
        router.push(`/login${nextQuery}`);
      }, 5000);
    } catch {
      setFormError('❌ Something went wrong. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  const loading = isPending || Boolean(oauthPending);

  const eircodeInputStyle =
    eircodeStatus === 'valid'
      ? {borderColor: '#00B894', boxShadow: '0 0 0 3px rgba(0, 184, 148, 0.15)'}
      : eircodeStatus === 'invalid'
        ? {borderColor: '#FF7675', boxShadow: '0 0 0 3px rgba(255, 118, 117, 0.15)'}
        : undefined;

  return (
    <motion.section
      className={`${styles.panel} ${styles.formPanel}`}
      variants={rightColumnVariants}
      initial="hidden"
      animate="visible"
      aria-label="Sign up form"
    >
      <h2 className={styles.formTitle}>Create your account</h2>
      <p className={styles.formSubtitle}>Join the marketplace in less than 2 minutes</p>

      <RoleSelector value={role} onChange={setRole} />

      {formError ? <div className={styles.error}>{formError}</div> : null}
      {success ? <div className={styles.toast}>{success}</div> : null}

      <motion.div variants={formListVariants} initial="hidden" animate="visible">
        <motion.div variants={formItemVariants}>
          <SocialButtons inline pendingProvider={oauthPending} onLogin={signUpWithOAuth} />
        </motion.div>

        <motion.form onSubmit={onSubmit} noValidate variants={formItemVariants} className={styles.formGrid}>
          <label className={styles.field}>
            <span>Full name</span>
            <div className={styles.inputWrap}>
              <UserRound size={16} aria-hidden="true" />
              <input
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="John Murphy"
              />
            </div>
            {errors.fullName ? <p className={styles.fieldError}>{errors.fullName}</p> : null}
          </label>

          <label className={styles.field}>
            <span>Phone</span>
            <div className={styles.inputWrap}>
              <Phone size={16} aria-hidden="true" />
              <input
                value={form.phone}
                onChange={(event) => {
                  const raw = toRawIrishNumber(event.target.value);
                  const localDigits = raw.startsWith('353')
                    ? raw.slice(3)
                    : raw.startsWith('0')
                      ? raw.slice(1)
                      : raw;

                  if (localDigits.length > 9) {
                    setErrors((prev) => ({
                      ...prev,
                      phone: 'Phone number must be 9 digits (without 0 or +353).'
                    }));
                    return;
                  }

                  updateField('phone', formatIrishPhone(event.target.value));
                }}
                placeholder="+353 87 123 4567"
              />
            </div>
            {errors.phone ? <p className={styles.fieldError}>{errors.phone}</p> : null}
          </label>

          <label className={styles.field}>
            <span>Email</span>
            <div className={styles.inputWrap}>
              <Mail size={16} aria-hidden="true" />
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="your@email.com"
              />
            </div>
            {errors.email ? <p className={styles.fieldError}>{errors.email}</p> : null}
          </label>

          <label className={styles.field}>
            <span>ID document</span>
            <div className={styles.inputWrap}>
              <UploadCloud size={16} aria-hidden="true" />
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setIdDocument(event.target.files?.[0] ?? null)} />
            </div>
            {errors.idDocument ? <p className={styles.fieldError}>{errors.idDocument}</p> : null}
          </label>

          {role === 'provider' ? (
            <>
              <label className={`${styles.field} ${styles.fullWidth}`}>
                <span>Address line 1 (Street + house number)</span>
                <div className={styles.inputWrap}>
                  <input
                    value={form.address1}
                    onChange={(event) => updateField('address1', event.target.value)}
                    placeholder="Street and house number"
                  />
                </div>
                {errors.address1 ? <p className={styles.fieldError}>{errors.address1}</p> : null}
              </label>

              <label className={`${styles.field} ${styles.fullWidth}`}>
                <span>Address line 2 (Locality/Town - optional)</span>
                <div className={styles.inputWrap}>
                  <input
                    value={form.address2}
                    onChange={(event) => updateField('address2', event.target.value)}
                    placeholder="Town or locality"
                  />
                </div>
              </label>

              <label className={styles.field}>
                <span>County</span>
                <div className={styles.inputWrap}>
                  <MapPin size={16} aria-hidden="true" />
                  <input
                    list="county-options"
                    value={form.county}
                    onChange={(event) => {
                      updateField('county', event.target.value);
                      updateField('city', '');
                      setCountyQuery(event.target.value);
                    }}
                    onInput={(event) => setCountyQuery((event.target as HTMLInputElement).value)}
                    placeholder="Search county"
                  />
                  <datalist id="county-options">
                    {filteredCounties.map((county) => (
                      <option key={county} value={county} />
                    ))}
                  </datalist>
                </div>
                {errors.county ? <p className={styles.fieldError}>{errors.county}</p> : null}
              </label>

              <label className={styles.field}>
                <span>City</span>
                <div className={styles.inputWrap}>
                  <MapPin size={16} aria-hidden="true" />
                  <select
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    style={{width: '100%', border: 0, outline: 'none', background: 'transparent'}}
                    disabled={!form.county}
                  >
                    <option value="">Select city</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.city ? <p className={styles.fieldError}>{errors.city}</p> : null}
              </label>

              <label className={styles.field}>
                <span>Eircode</span>
                <div className={styles.fieldButtonRow}>
                  <div className={styles.inputWrap} style={{flex: 1, ...eircodeInputStyle}}>
                    <input
                      value={form.eircode}
                      onChange={(event) => updateField('eircode', normalizeEircode(event.target.value))}
                      placeholder="D02 23B5"
                    />
                    {eircodeStatus === 'valid' ? <CheckCircle2 size={16} color="#00B894" /> : null}
                    {eircodeStatus === 'invalid' ? <CircleX size={16} color="#FF7675" /> : null}
                  </div>
                  <button
                    type="button"
                    className={styles.smallButton}
                    onClick={handleAddressLookup}
                    disabled={eircodeStatus === 'validating'}
                  >
                    {eircodeStatus === 'validating' ? (
                      <>
                        <Loader2 size={14} className={styles.spinner} /> Validating...
                      </>
                    ) : eircodeStatus === 'valid' ? (
                      '✅ Valid'
                    ) : eircodeStatus === 'invalid' ? (
                      '❌ Invalid'
                    ) : (
                      'Validate'
                    )}
                  </button>
                </div>
                {errors.eircode ? <p className={styles.fieldError}>{errors.eircode}</p> : null}
              </label>

              <label className={styles.field}>
                <span>Professional proof document</span>
                <div className={styles.inputWrap}>
                  <UploadCloud size={16} aria-hidden="true" />
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setProviderDocument(event.target.files?.[0] ?? null)} />
                </div>
                {errors.providerDocument ? <p className={styles.fieldError}>{errors.providerDocument}</p> : null}
              </label>
            </>
          ) : null}

          <label className={styles.field}>
            <span>Password</span>
            <div className={styles.inputWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="••••••••••"
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
            {errors.password ? <p className={styles.fieldError}>{errors.password}</p> : null}
          </label>

          <label className={styles.field}>
            <span>Confirm password</span>
            <div className={styles.inputWrap}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                placeholder="••••••••••"
              />
              <button
                className={styles.togglePassword}
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.confirmPassword ? <p className={styles.fieldError}>{errors.confirmPassword}</p> : null}
          </label>

          <div className={styles.fullWidth}>
            <PasswordStrength password={form.password} checks={passwordChecks} />
          </div>

          <div className={styles.fullWidth}>
            <IdentityConsent
              checked={form.identityConsent}
              onChange={(checked) => updateField('identityConsent', checked)}
            />
            {errors.identityConsent ? <p className={styles.fieldError}>{errors.identityConsent}</p> : null}
          </div>

          <div className={styles.fullWidth}>
            <button type="submit" className={styles.primaryButton} disabled={loading || !form.identityConsent}>
              {isPending ? (
                <>
                  <Loader2 size={18} className={styles.spinner} /> Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </motion.form>

        <motion.p variants={formItemVariants} className={styles.linkRow}>
          Already have an account? <Link href="/login">Log in</Link>
        </motion.p>

        <motion.div variants={formItemVariants}>
          <SecurityDropdown
            title="Secure Sign Up"
            isOpen={isSecurityOpen}
            onToggle={() => setIsSecurityOpen((current) => !current)}
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
