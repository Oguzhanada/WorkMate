"use client";

import {FormEvent, useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useLocale, useTranslations} from 'next-intl';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {IRISH_COUNTIES, getCitiesByCounty} from '@/lib/ireland-locations';
import styles from '../inner.module.css';

type Mode = 'customer' | 'provider';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('signup');
  const intentId = searchParams.get('intent') ?? '';
  const intentEmail = searchParams.get('email') ?? '';

  const [mode, setMode] = useState<Mode>('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [eircode, setEircode] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [services, setServices] = useState('');
  const [region, setRegion] = useState('');
  const [isLookingUpAddress, setIsLookingUpAddress] = useState(false);
  const cityOptions = getCitiesByCounty(county);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({data}) => {
      if (data.user) {
        router.replace(`/${locale}/profil`);
      }
    });
  }, [locale, router]);

  useEffect(() => {
    if (intentEmail && !email) {
      setEmail(intentEmail);
    }
  }, [email, intentEmail]);

  const passwordChecks = {
    minLength: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const passwordScore = Math.round((Object.values(passwordChecks).filter(Boolean).length / 5) * 100);
  const strengthColor =
    passwordScore < 40 ? '#e67e22' : passwordScore < 80 ? '#f1c40f' : '#22a55c';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (!name || !phone || !city || !county || !email || !password || !eircode || !addressLine1) {
      setErrorMessage(t('errors.required'));
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage(t('errors.invalidEmail'));
      return;
    }

    if (!isPasswordStrong) {
      setErrorMessage(t('errors.passwordRules'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('errors.passwordMatch'));
      return;
    }

    if (mode === 'provider' && (!services || !region)) {
      setErrorMessage(t('errors.services'));
      return;
    }

    const checkEircode = await fetch(`/api/address-lookup?eircode=${encodeURIComponent(eircode)}`);
    if (!checkEircode.ok) {
      setErrorMessage(t('errors.addressLookup'));
      return;
    }

    setIsPending(true);

    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/${locale}/profil`;

    const {data, error} = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: name,
          phone,
          city,
          eircode,
          address_line_1: addressLine1,
          address_line_2: addressLine2,
          locality: city,
          county,
          role: mode === 'provider' ? 'verified_pro' : 'customer'
        }
      }
    });

    if (error) {
      setIsPending(false);
      setErrorMessage(error.message);
      return;
    }

    if (!data.session) {
      setIsPending(false);
      const nextQuery = intentId
        ? `?intent=${encodeURIComponent(intentId)}${intentEmail ? `&email=${encodeURIComponent(intentEmail)}` : ''}`
        : '';
      router.push(`/${locale}/giris${nextQuery}`);
      return;
    }

    setIsPending(false);
    if (intentId) {
      const claimResponse = await fetch('/api/guest-jobs/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent_id: intentId }),
      });

      if (!claimResponse.ok) {
        const claimPayload = await claimResponse.json();
        setErrorMessage(claimPayload.error || 'Taslak ilan yayinlanamadi. Profilinden tekrar deneyebilirsin.');
      }
    }

    router.push(`/${locale}/profil`);
    router.refresh();
  };

  const lookupAddress = async () => {
    const normalized = eircode.trim().toUpperCase();
    if (!normalized) {
      setErrorMessage(t('errors.eircodeRequired'));
      return;
    }

    setErrorMessage('');
    setIsLookingUpAddress(true);
    const response = await fetch(`/api/address-lookup?eircode=${encodeURIComponent(normalized)}`);
    const payload = await response.json();
    setIsLookingUpAddress(false);

    if (!response.ok) {
      setErrorMessage(payload.error || t('errors.addressLookup'));
      return;
    }

    const address = payload.address ?? {};
    setEircode(address.eircode ?? normalized);
    setErrorMessage('');
  };

  return (
    <main className={styles.formWrap}>
      <h1 className={styles.formTitle}>{t('title')}</h1>
      <p className={styles.muted}>{t('subtitle')}</p>

      {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}

      <div className={styles.tabRow}>
        <button
          type="button"
          className={`${styles.tabButton} ${mode === 'customer' ? styles.activeTab : ''}`}
          onClick={() => setMode('customer')}
        >
          {t('customerTab')}
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${mode === 'provider' ? styles.activeTab : ''}`}
          onClick={() => setMode('provider')}
        >
          {t('providerTab')}
        </button>
      </div>

      <button className={styles.oauthButton} type="button" disabled>
        <i className="fa-brands fa-google" /> {t('google')}
      </button>
      <button className={styles.oauthButton} type="button" disabled>
        <i className="fa-brands fa-apple" /> {t('apple')}
      </button>
      <button className={styles.oauthButton} type="button" disabled>
        <i className="fa-brands fa-facebook" /> {t('facebook')}
      </button>
      <p className={styles.muted}>{t('oauthSoon')}</p>

      <form onSubmit={onSubmit}>
        <div className={styles.formRow}>
          <label className={styles.field}>
            <span>{t('fields.name')}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} name="name" />
          </label>

          <label className={styles.field}>
            <span>{t('fields.phone')}</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} name="phone" />
          </label>
        </div>

        <div className={styles.formRow}>
          <label className={styles.field}>
            <span>{t('fields.county')}</span>
            <select
              value={county}
              onChange={(event) => {
                setCounty(event.target.value);
                setCity('');
              }}
              name="county"
            >
              <option value="">{t('fields.selectCounty')}</option>
              {IRISH_COUNTIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>{t('fields.city')}</span>
            <select value={city} onChange={(event) => setCity(event.target.value)} name="city" disabled={!county}>
              <option value="">{t('fields.selectCity')}</option>
              {cityOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={styles.field}>
          <span>{t('fields.email')}</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} name="email" />
        </label>

        <div className={styles.formRow}>
          <label className={styles.field}>
            <span>{t('fields.eircode')}</span>
            <input value={eircode} onChange={(event) => setEircode(event.target.value.toUpperCase())} name="eircode" placeholder="D02 X285" />
          </label>
          <div className={styles.field}>
            <span>{t('fields.lookupAddress')}</span>
            <button type="button" className={styles.secondary} onClick={lookupAddress} disabled={isLookingUpAddress}>
              {isLookingUpAddress ? t('fields.lookingUp') : t('fields.lookupButton')}
            </button>
          </div>
        </div>

        <label className={styles.field}>
          <span>{t('fields.addressLine1')}</span>
          <input value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} name="addressLine1" />
        </label>

        <label className={styles.field}>
          <span>{t('fields.addressLine2')}</span>
          <input value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} name="addressLine2" />
        </label>

        <label className={styles.field}>
          <span>{t('fields.password')}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            name="password"
          />
        </label>
        <label className={styles.field}>
          <span>{t('fields.confirmPassword')}</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            name="confirmPassword"
          />
        </label>
        <div className={styles.field}>
          <div className={styles.passwordPanel}>
            <p className={styles.strengthHead}>
              {t('passwordRules.strength', {score: passwordScore})}
            </p>
            <div className={styles.strengthTrack}>
              <div
                className={styles.strengthFill}
                style={{width: `${passwordScore}%`, backgroundColor: strengthColor}}
              />
            </div>
            <ul className={styles.ruleList}>
              <li className={`${styles.ruleItem} ${passwordChecks.minLength ? styles.ruleOk : ''}`}>
                <i className={`fa-solid ${passwordChecks.minLength ? 'fa-check' : 'fa-circle'}`} />
                {t('passwordRules.minLength')}
              </li>
              <li className={`${styles.ruleItem} ${passwordChecks.lower ? styles.ruleOk : ''}`}>
                <i className={`fa-solid ${passwordChecks.lower ? 'fa-check' : 'fa-circle'}`} />
                {t('passwordRules.lower')}
              </li>
              <li className={`${styles.ruleItem} ${passwordChecks.upper ? styles.ruleOk : ''}`}>
                <i className={`fa-solid ${passwordChecks.upper ? 'fa-check' : 'fa-circle'}`} />
                {t('passwordRules.upper')}
              </li>
              <li className={`${styles.ruleItem} ${passwordChecks.number ? styles.ruleOk : ''}`}>
                <i className={`fa-solid ${passwordChecks.number ? 'fa-check' : 'fa-circle'}`} />
                {t('passwordRules.number')}
              </li>
              <li className={`${styles.ruleItem} ${passwordChecks.special ? styles.ruleOk : ''}`}>
                <i className={`fa-solid ${passwordChecks.special ? 'fa-check' : 'fa-circle'}`} />
                {t('passwordRules.special')}
              </li>
            </ul>
          </div>
        </div>

        {mode === 'provider' ? (
          <>
            <label className={styles.field}>
              <span>{t('fields.services')}</span>
              <input value={services} onChange={(event) => setServices(event.target.value)} name="services" />
            </label>
            <label className={styles.field}>
              <span>{t('fields.region')}</span>
              <input value={region} onChange={(event) => setRegion(event.target.value)} name="region" />
            </label>
            <p className={styles.muted}>{t('verificationNote')}</p>
            <p className={styles.muted}>{t('bankInfoNote')}</p>
          </>
        ) : null}

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={isPending}>
            {t('create')}
          </button>
        </div>
      </form>
    </main>
  );
}
