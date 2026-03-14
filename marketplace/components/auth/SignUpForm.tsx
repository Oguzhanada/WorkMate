"use client";

import Link from 'next/link';
import {useMemo} from 'react';
import {usePathname} from 'next/navigation';
import {motion} from 'framer-motion';
import {
  AtSign,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MapPin,
  Phone,
  UserRound
} from 'lucide-react';

import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';
import {normalizeIrishPhone} from '@/lib/ireland/phone';
import {formItemVariants, formListVariants, rightColumnVariants} from '@/styles/animations';
import {IdentityConsent} from './IdentityConsent';
import {PasswordStrength} from './PasswordStrength';
import {RoleSelector} from './RoleSelector';
import {SecurityDropdown} from './SecurityDropdown';
import {SocialButtons} from './SocialButtons';
import {TurnstileWidget} from '@/components/cloudflare/TurnstileWidget';
import Button from '@/components/ui/Button';
import styles from './login.module.css';

import {useSignUpFormState} from './hooks/useSignUpFormState';
import {useEircodeValidation} from './hooks/useEircodeValidation';
import {useSignUpSubmit} from './hooks/useSignUpSubmit';

/* ---------- pure helpers (no hooks) ---------- */

function normalizeEircode(value: string) {
  const compact = value.toUpperCase().replace(/\s+/g, '');
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, 3)} ${compact.slice(3, 7)}`;
}

function toRawIrishNumber(masked: string) {
  return masked.replace(/\D/g, '');
}

function formatIrishPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  const local = digits.startsWith('353') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
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

/* ---------- component ---------- */

export function SignUpForm() {
  const pathname = usePathname() || '/';
  const localeRoot = useMemo(() => getLocaleRoot(pathname), [pathname]);

  const state = useSignUpFormState();
  const {
    form, setForm, errors, setErrors,
    formError, setFormError, success, setSuccess,
    isPending, setIsPending,
    role, setRole,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    isSecurityOpen, setIsSecurityOpen,
    intentId, intentEmail,
    eircodeStatus, setEircodeStatus,
    passwordChecks, updateField,
    cfToken, handleTurnstileVerify, handleTurnstileExpire,
    oauthPending, setOauthPending,
    loading,
  } = state;

  const eircode = useEircodeValidation(
    form, setForm, role, eircodeStatus, setEircodeStatus, setErrors,
  );
  const {
    setCountyQuery,
    eircodeLoading, eircodeSuggestion,
    eircodeDropdownOpen, setEircodeDropdownOpen,
    cityOptions, filteredCounties,
    applyEircodeSuggestion,
  } = eircode;

  const {onSubmit, signUpWithOAuth} = useSignUpSubmit({
    form, role, cfToken, intentId, intentEmail, localeRoot,
    setErrors, setFormError, setSuccess, setIsPending, setOauthPending,
  });

  const eircodeInputStyle =
    eircodeStatus === 'valid'
      ? {borderColor: 'var(--wm-primary)', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.15)'}
      : eircodeStatus === 'invalid'
        ? {borderColor: 'var(--wm-destructive)', boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.15)'}
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
      <section className={styles.guidelinesCard}>
        <p className={styles.guidelinesTitle}>Community rules snapshot</p>
        <ul className={styles.guidelinesList}>
          <li>18+ only and one active account per person.</li>
          <li>Respectful communication only.</li>
          <li>Keep payments and communication on WorkMate.</li>
          <li>No illegal or prohibited services.</li>
        </ul>
        <Link href={withLocalePrefix(localeRoot, '/community-guidelines')} className={styles.guidelinesLink}>
          Read full Community Guidelines
        </Link>
      </section>

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
                type="text"
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="John Murphy"
                autoComplete="name"
              />
            </div>
            {errors.fullName ? <p className={styles.fieldError}>{errors.fullName}</p> : null}
          </label>

          <label className={styles.field}>
            <span>Username</span>
            <div className={styles.inputWrap}>
              <AtSign size={16} aria-hidden="true" />
              <input
                value={form.username}
                onChange={(event) =>
                  updateField('username', event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                placeholder="john_murphy"
                maxLength={20}
                autoComplete="username"
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--wm-muted)', marginTop: '3px' }}>
              3–20 characters. Letters, numbers, underscores only. Used to log in.
            </p>
            {errors.username ? <p className={styles.fieldError}>{errors.username}</p> : null}
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
                  updateField('phone', formatIrishPhone(localDigits));
                }}
                onBlur={() => updateField('phone', formatIrishPhone(normalizeIrishPhone(form.phone)))}
                placeholder="+353 87 123 4567"
                autoComplete="tel"
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
                autoComplete="email"
              />
            </div>
            {errors.email ? <p className={styles.fieldError}>{errors.email}</p> : null}
          </label>

          {role === 'provider' ? (
            <>
              {/* Eircode first — autocomplete fills the fields below */}
              <label className={`${styles.field} ${styles.fullWidth}`} style={{ position: 'relative' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Eircode
                  {eircodeLoading && <Loader2 size={13} className={styles.spinner} style={{ color: 'var(--wm-muted)' }} />}
                  {eircodeStatus === 'valid' && !eircodeLoading && <CheckCircle2 size={13} color="var(--wm-primary)" />}
                </span>
                <div className={styles.inputWrap} style={eircodeInputStyle}>
                  <MapPin size={16} aria-hidden="true" />
                  <input
                    value={form.eircode}
                    onChange={(event) => updateField('eircode', normalizeEircode(event.target.value))}
                    placeholder="D02 X285 — start typing to auto-fill address"
                    autoComplete="off"
                    onBlur={() => setEircodeDropdownOpen(false)}
                    onFocus={() => { if (eircodeSuggestion) setEircodeDropdownOpen(true); }}
                  />
                </div>
                {eircodeDropdownOpen && eircodeSuggestion && (
                  <div className={styles.eircodeDropdown} onMouseDown={(e) => e.preventDefault()}>
                    <button
                      type="button"
                      className={styles.eircodeDropdownItem}
                      onClick={applyEircodeSuggestion}
                    >
                      <span className={styles.eircodeDropdownMain}>
                        {[eircodeSuggestion.line1, eircodeSuggestion.line2].filter(Boolean).join(', ')}
                      </span>
                      <span className={styles.eircodeDropdownSub}>
                        {[eircodeSuggestion.postTown, eircodeSuggestion.county].filter(Boolean).join(', ')}
                      </span>
                    </button>
                  </div>
                )}
                {errors.eircode ? <p className={styles.fieldError}>{errors.eircode}</p> : null}
              </label>

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
              <Button
                variant="ghost"
                size="sm"
                className={styles.togglePassword}
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </Button>
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
            {errors.identityConsent ? (
              <p className={styles.fieldError} style={{marginTop: '6px'}}>{errors.identityConsent}</p>
            ) : null}
          </div>

          {/* Optional referral code */}
          <div className={styles.fullWidth}>
            <details style={{ marginBottom: 4 }}>
              <summary style={{ fontSize: '0.82rem', color: 'var(--wm-muted)', cursor: 'pointer', userSelect: 'none' }}>
                Have a referral code?
              </summary>
              <div className={styles.field} style={{ marginTop: 8 }}>
                <label htmlFor="signup-referral">Referral code (optional)</label>
                <div className={styles.inputWrap}>
                  <input
                    id="signup-referral"
                    name="referral_code"
                    type="text"
                    value={form.referralCode}
                    placeholder="WM-XXXXXXXX"
                    autoComplete="off"
                    maxLength={32}
                    onChange={(e) => updateField('referralCode', e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                </div>
              </div>
            </details>
          </div>

          <div className={styles.fullWidth}>
            <TurnstileWidget
              onVerify={handleTurnstileVerify}
              onExpire={handleTurnstileExpire}
            />
          </div>

          <div className={styles.fullWidth}>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              className={styles.primaryButton}
              disabled={loading}
              loading={isPending}
            >
              {isPending ? 'Creating account...' : 'Create account'}
            </Button>
          </div>
        </motion.form>

        <motion.p variants={formItemVariants} className={styles.linkRow}>
          Already have an account? <Link href={withLocalePrefix(localeRoot, '/login')}>Log in</Link>
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
