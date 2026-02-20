"use client";

import {FormEvent, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useLocale, useTranslations} from 'next-intl';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import styles from '../inner.module.css';

type Step = 1 | 2 | 3 | 4;

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  verification_status: string;
};

export default function BecomeProviderPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('becomeProvider');

  const [step, setStep] = useState<Step>(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');

  const [primaryServices, setPrimaryServices] = useState('');
  const [experience, setExperience] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [availability, setAvailability] = useState('');
  const [primaryCity, setPrimaryCity] = useState('');
  const [secondaryAreas, setSecondaryAreas] = useState('');
  const [radius, setRadius] = useState('');
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [insuranceDocument, setInsuranceDocument] = useState<File | null>(null);

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: {user}
      } = await supabase.auth.getUser();

      if (!user) {
        setError(t('needLogin'));
        router.replace(`/${locale}/giris`);
        return;
      }

      setEmail(user.email ?? '');

      const {data} = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setMessage(t('profileLoaded'));
      }
    };

    run();
  }, [locale, router, t]);

  const next = () => setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  const back = () => setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));

  const uploadDocument = async (
    userId: string,
    file: File,
    type: 'id_verification' | 'public_liability_insurance'
  ) => {
    const supabase = getSupabaseBrowserClient();
    const path = `pro-documents/${userId}/${Date.now()}-${file.name}`;

    const {error: uploadError} = await supabase.storage.from('pro-documents').upload(path, file, {
      upsert: false
    });

    if (uploadError) throw uploadError;

    const {error: docError} = await supabase.from('pro_documents').insert({
      profile_id: userId,
      document_type: type,
      storage_path: path,
      verification_status: 'pending'
    });

    if (docError) throw docError;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!idDocument) {
      setError(t('missingDoc'));
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const {
      data: {user}
    } = await supabase.auth.getUser();

    if (!user) {
      setError(t('needLogin'));
      router.replace(`/${locale}/giris`);
      return;
    }

    try {
      setIsPending(true);

      await uploadDocument(user.id, idDocument, 'id_verification');

      if (insuranceDocument) {
        await uploadDocument(user.id, insuranceDocument, 'public_liability_insurance');
      }

      const {error: profileError} = await supabase
        .from('profiles')
        .update({
          role: 'verified_pro',
          verification_status: 'pending',
          is_verified: false,
          stripe_requirements_due: {
            primary_services: primaryServices,
            experience,
            portfolio,
            availability,
            primary_city: primaryCity,
            secondary_areas: secondaryAreas,
            radius
          }
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setMessage(t('submitSuccess'));
      setStep(1);
      router.push(`/${locale}/profil`);
      router.refresh();
    } catch (_err) {
      setError(t('submitError'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <main>
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.banner}>
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
            <h3>{t('benefits.title')}</h3>
            <ul className={styles.benefitList}>
              <li>
                <i className="fa-solid fa-check" /> {t('benefits.setPrices')}
              </li>
              <li>
                <i className="fa-solid fa-check" /> {t('benefits.chooseJobs')}
              </li>
              <li>
                <i className="fa-solid fa-check" /> {t('benefits.securePaid')}
              </li>
              <li>
                <i className="fa-solid fa-check" /> {t('benefits.reviews')}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.formWrap}>
        {message ? <div className={styles.toast}>{message}</div> : null}
        {error ? <div className={styles.error}>{error}</div> : null}

        <h2>{t(`steps.${step === 1 ? 'one' : step === 2 ? 'two' : step === 3 ? 'three' : 'four'}`)}</h2>

        <form onSubmit={onSubmit}>
          {step === 1 ? (
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>{t('form.fullName')}</span>
                <input value={profile?.full_name ?? ''} readOnly />
              </label>
              <label className={styles.field}>
                <span>{t('form.email')}</span>
                <input value={email} readOnly />
              </label>
              <label className={styles.field}>
                <span>{t('form.phone')}</span>
                <input value={profile?.phone ?? ''} readOnly />
              </label>
              <label className={styles.field}>
                <span>{t('form.city')}</span>
                <input value={primaryCity} onChange={(event) => setPrimaryCity(event.target.value)} placeholder="Dublin" />
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>{t('form.primaryServices')}</span>
                <input value={primaryServices} onChange={(event) => setPrimaryServices(event.target.value)} placeholder="Home Cleaning, AC Service" />
              </label>
              <label className={styles.field}>
                <span>{t('form.experience')}</span>
                <input value={experience} onChange={(event) => setExperience(event.target.value)} placeholder="5 years" />
              </label>
              <label className={styles.field}>
                <span>{t('form.portfolio')}</span>
                <input value={portfolio} onChange={(event) => setPortfolio(event.target.value)} placeholder="https://" />
              </label>
              <label className={styles.field}>
                <span>{t('form.availability')}</span>
                <input value={availability} onChange={(event) => setAvailability(event.target.value)} placeholder="Weekdays 09:00 - 18:00" />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>{t('form.primaryCity')}</span>
                <input value={primaryCity} onChange={(event) => setPrimaryCity(event.target.value)} placeholder="Dublin" />
              </label>
              <label className={styles.field}>
                <span>{t('form.secondaryAreas')}</span>
                <input value={secondaryAreas} onChange={(event) => setSecondaryAreas(event.target.value)} placeholder="Cork, Galway" />
              </label>
              <label className={styles.field}>
                <span>{t('form.radius')}</span>
                <input value={radius} onChange={(event) => setRadius(event.target.value)} placeholder="Up to 30 km" />
              </label>
            </div>
          ) : null}

          {step === 4 ? (
            <div className={styles.field}>
              <span>{t('docsHint')}</span>
              <label className={styles.field}>
                <span>{t('idDoc')}</span>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setIdDocument(event.target.files?.[0] ?? null)} />
              </label>
              <label className={styles.field}>
                <span>{t('insuranceDoc')}</span>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setInsuranceDocument(event.target.files?.[0] ?? null)} />
              </label>
              <p className={styles.muted}>{t('form.bankInfo')}</p>
            </div>
          ) : null}

          <div className={styles.actions}>
            {step > 1 ? (
              <button type="button" className={styles.secondary} onClick={back}>
                {t('back')}
              </button>
            ) : null}

            {step < 4 ? (
              <button type="button" className={styles.primary} onClick={next}>
                {t('next')}
              </button>
            ) : (
              <button type="submit" className={styles.primary} disabled={isPending}>
                {t('submit')}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
