"use client";

import {FormEvent, useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useLocale, useTranslations} from 'next-intl';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {IRISH_COUNTIES} from '@/lib/ireland-locations';
import styles from '../inner.module.css';

type Step = 1 | 2 | 3 | 4;

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  verification_status: string;
};

const IRISH_CITIES = ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 'Sligo', 'Athlone', 'Wexford', 'Drogheda', 'Other'];
const EXPERIENCE_OPTIONS = ['0-1 years', '1-2 years', '3-5 years', '5-10 years', '10+ years'];
const AVAILABILITY_OPTIONS = ['Weekdays 08:00-12:00', 'Weekdays 12:00-18:00', 'Weekdays 18:00-22:00', 'Weekend mornings', 'Weekend afternoons', 'Weekend evenings', 'Other'];
const RADIUS_OPTIONS = ['Up to 10 km', 'Up to 20 km', 'Up to 30 km', 'Up to 50 km', 'Ireland-wide'];
const COUNTY_OPTIONS = [...IRISH_COUNTIES, 'Ireland-wide'];

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
};

export default function BecomeProviderPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('becomeProvider');

  const [step, setStep] = useState<Step>(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');

  const [primaryCity, setPrimaryCity] = useState('');
  const [otherPrimaryCity, setOtherPrimaryCity] = useState('');

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [otherService, setOtherService] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [experienceRange, setExperienceRange] = useState('');
  const [optionalLink, setOptionalLink] = useState('');
  const [availabilitySelections, setAvailabilitySelections] = useState<string[]>([]);
  const [otherAvailability, setOtherAvailability] = useState('');

  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
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

      const categoryResponse = await fetch('/api/categories', {cache: 'no-store'});
      const categoryPayload = await categoryResponse.json();
      if (categoryResponse.ok) {
        const all = (categoryPayload.categories ?? []) as Category[];
        setCategories(all.filter((item) => item.parent_id !== null));
      }
    };

    run();
  }, [locale, router, t]);

  const selectedServicesList = useMemo(() => {
    const selectedNames = categories
      .filter((item) => selectedServiceIds.includes(item.id))
      .map((item) => item.name);

    return selectedNames;
  }, [categories, selectedServiceIds]);

  const selectedAreasList = useMemo(() => selectedAreas, [selectedAreas]);

  const resolvedPrimaryCity = primaryCity === 'Other' ? otherPrimaryCity.trim() : primaryCity;
  const resolvedAvailability = useMemo(() => {
    const filtered = availabilitySelections.filter((item) => item !== 'Other');
    if (availabilitySelections.includes('Other') && otherAvailability.trim()) {
      filtered.push(otherAvailability.trim());
    }
    return filtered;
  }, [availabilitySelections, otherAvailability]);

  const toggleSelection = (current: string[], value: string, setter: (next: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter((item) => item !== value));
      return;
    }
    setter([...current, value]);
  };

  const validateStep = (targetStep: Step) => {
    if (targetStep === 1) {
      if (!resolvedPrimaryCity) {
        setError(t('errors.cityRequired'));
        return false;
      }
    }

    if (targetStep === 2) {
      if (selectedServiceIds.length === 0) {
        setError(t('errors.serviceRequired'));
        return false;
      }
      if (!experienceRange) {
        setError(t('errors.experienceRequired'));
        return false;
      }
      if (!availabilitySelections.length) {
        setError(t('errors.availabilityRequired'));
        return false;
      }
      if (availabilitySelections.includes('Other') && !otherAvailability.trim()) {
        setError(t('errors.otherAvailabilityRequired'));
        return false;
      }
    }

    if (targetStep === 3) {
      if (!selectedAreas.length) {
        setError(t('errors.areaRequired'));
        return false;
      }
      if (!radius) {
        setError(t('errors.radiusRequired'));
        return false;
      }
    }

    setError('');
    return true;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  };
  const back = () => {
    setError('');
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

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

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

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

      if (idDocument) {
        await uploadDocument(user.id, idDocument, 'id_verification');
      }

      if (insuranceDocument) {
        await uploadDocument(user.id, insuranceDocument, 'public_liability_insurance');
      }

      const {error: profileError} = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          is_verified: false,
          stripe_requirements_due: {
            application_status: 'submitted',
            submitted_at: new Date().toISOString(),
            personal_info: {
              full_name: profile?.full_name ?? null,
              email,
              phone: profile?.phone ?? null,
              primary_city: resolvedPrimaryCity
            },
            services_and_skills: {
              services: selectedServicesList,
              experience_range: experienceRange,
              optional_link: optionalLink.trim() || null,
              availability: resolvedAvailability
            },
            areas_served: {
              counties: selectedAreasList,
              radius
            },
            documents_uploaded: {
              id_document_uploaded: !!idDocument,
              insurance_document_uploaded: !!insuranceDocument
            },
            reminder: 'PRODUCTION: ID document must be mandatory before activation.'
          }
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const {error: deleteServicesError} = await supabase.from('pro_services').delete().eq('profile_id', user.id);
      if (deleteServicesError) throw deleteServicesError;

      if (selectedServiceIds.length > 0) {
        const serviceRows = selectedServiceIds.map((categoryId) => ({
          profile_id: user.id,
          category_id: categoryId
        }));
        const {error: insertServicesError} = await supabase.from('pro_services').insert(serviceRows);
        if (insertServicesError) throw insertServicesError;
      }

      const {error: deleteAreasError} = await supabase.from('pro_service_areas').delete().eq('profile_id', user.id);
      if (deleteAreasError) throw deleteAreasError;

      if (selectedAreasList.length > 0) {
        const areaRows = selectedAreasList.map((county) => ({
          profile_id: user.id,
          county
        }));
        const {error: insertAreasError} = await supabase.from('pro_service_areas').insert(areaRows);
        if (insertAreasError) throw insertAreasError;
      }

      setIsSubmitted(true);
      setMessage(t('submitSuccess'));
      setStep(1);
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

        {isSubmitted ? (
          <div className={styles.field}>
            <h2>{t('applicationFlowTitle')}</h2>
            <p className={styles.muted}>{t('applicationFlow1')}</p>
            <p className={styles.muted}>{t('applicationFlow2')}</p>
            <p className={styles.muted}>{t('applicationFlow3')}</p>
            <p className={styles.muted}>{t('prodReminder')}</p>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={() => router.push(`/${locale}/profil`)}>
                {t('goProfile')}
              </button>
            </div>
          </div>
        ) : (
          <>
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
                    <span>{t('form.primaryCity')}</span>
                    <select value={primaryCity} onChange={(event) => setPrimaryCity(event.target.value)}>
                      <option value="">{t('form.selectCity')}</option>
                      {IRISH_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </label>
                  {primaryCity === 'Other' ? (
                    <label className={styles.field}>
                      <span>{t('form.otherCity')}</span>
                      <input value={otherPrimaryCity} onChange={(event) => setOtherPrimaryCity(event.target.value)} />
                    </label>
                  ) : null}
                </div>
              ) : null}

              {step === 2 ? (
                <div className={styles.field}>
                  <span>{t('form.primaryServices')}</span>
                  {categories.map((service) => (
                    <label key={service.id} className={styles.muted}>
                      <input
                        type="checkbox"
                        checked={selectedServiceIds.includes(service.id)}
                        onChange={() => toggleSelection(selectedServiceIds, service.id, setSelectedServiceIds)}
                      />{' '}
                      {service.name}
                    </label>
                  ))}

                  <label className={styles.field}>
                    <span>{t('form.experienceRange')}</span>
                    <select value={experienceRange} onChange={(event) => setExperienceRange(event.target.value)}>
                      <option value="">{t('form.selectExperience')}</option>
                      {EXPERIENCE_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>{t('form.optionalLink')}</span>
                    <input value={optionalLink} onChange={(event) => setOptionalLink(event.target.value)} placeholder="https://" />
                  </label>

                  <label className={styles.field}>
                    <span>{t('form.availability')}</span>
                    {AVAILABILITY_OPTIONS.map((item) => (
                      <label key={`availability-${item}`} className={styles.muted}>
                        <input
                          type="checkbox"
                          checked={availabilitySelections.includes(item)}
                          onChange={() => toggleSelection(availabilitySelections, item, setAvailabilitySelections)}
                        />{' '}
                        {item}
                      </label>
                    ))}
                  </label>
                  {availabilitySelections.includes('Other') ? (
                    <label className={styles.field}>
                      <span>{t('form.otherAvailability')}</span>
                      <input value={otherAvailability} onChange={(event) => setOtherAvailability(event.target.value)} />
                    </label>
                  ) : null}
                </div>
              ) : null}

              {step === 3 ? (
                <div className={styles.field}>
                  <span>{t('form.secondaryAreas')}</span>
                  {COUNTY_OPTIONS.map((city) => (
                    <label key={`area-${city}`} className={styles.muted}>
                      <input
                        type="checkbox"
                        checked={selectedAreas.includes(city)}
                        onChange={() => toggleSelection(selectedAreas, city, setSelectedAreas)}
                      />{' '}
                      {city}
                    </label>
                  ))}

                  <label className={styles.field}>
                    <span>{t('form.radius')}</span>
                    <select value={radius} onChange={(event) => setRadius(event.target.value)}>
                      <option value="">{t('form.selectRadius')}</option>
                      {RADIUS_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
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
                    {isPending ? t('submitting') : t('submit')}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
