"use client";

import {FormEvent, useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {IRISH_COUNTIES} from '@/lib/ireland-locations';
import {isValidIrishPhone, normalizeIrishPhone, sanitizePhoneInput} from '@/lib/validation/phone';
import {hasAtLeastTwoNameParts, isValidEnglishFullName} from '@/lib/validation/name';
import {useCategoriesWithFallback, type Category} from '@/lib/hooks/useCategoriesWithFallback';
import MultiSelectDropdown from '@/components/forms/MultiSelectDropdown';
import styles from '../inner.module.css';

type Step = 1 | 2 | 3 | 4;

const IRISH_CITIES = ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 'Sligo', 'Athlone', 'Wexford', 'Drogheda', 'Other'];
const EXPERIENCE_OPTIONS = ['0-1 years', '1-2 years', '3-5 years', '5-10 years', '10+ years'];
const AVAILABILITY_OPTIONS = ['Weekdays 08:00-12:00', 'Weekdays 12:00-18:00', 'Weekdays 18:00-22:00', 'Weekend mornings', 'Weekend afternoons', 'Weekend evenings', 'Other'];
const RADIUS_OPTIONS = ['Up to 10 km', 'Up to 20 km', 'Up to 30 km', 'Up to 50 km', 'Ireland-wide'];
const COUNTY_OPTIONS = [...IRISH_COUNTIES, 'Ireland-wide'];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function BecomeProviderPage() {
  const router = useRouter();
  const t = useTranslations('becomeProvider');
  const {categories, isLoading: isLoadingCategories, notice: categoryNotice, isFallback} = useCategoriesWithFallback({
    leafOnly: true,
    fallbackNotice: 'Service list is temporarily unavailable. Showing fallback categories.'
  });

  const [step, setStep] = useState<Step>(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [prefillNotice, setPrefillNotice] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [skipPersonalInfoStep, setSkipPersonalInfoStep] = useState(false);

  const [email, setEmail] = useState('');
  const [isEmailLocked, setIsEmailLocked] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [primaryCity, setPrimaryCity] = useState('');
  const [otherPrimaryCity, setOtherPrimaryCity] = useState('');

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [otherService, setOtherService] = useState('');
  const [experienceRange, setExperienceRange] = useState('');
  const [optionalLink, setOptionalLink] = useState('');
  const [availabilitySelections, setAvailabilitySelections] = useState<string[]>([]);
  const [otherAvailability, setOtherAvailability] = useState('');

  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [radius, setRadius] = useState('');

  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [insuranceDocument, setInsuranceDocument] = useState<File | null>(null);
  const [hasVerifiedIdentity, setHasVerifiedIdentity] = useState(false);
  const [hasExistingIdDocument, setHasExistingIdDocument] = useState(false);
  const [hasExistingInsuranceDocument, setHasExistingInsuranceDocument] = useState(false);

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: {user}
      } = await supabase.auth.getUser();

      if (!user) {
        setError(t('needLogin'));
        router.replace(`/login`);
        return;
      }

      const userEmail = user.email ?? '';
      setEmail(userEmail);
      setIsEmailLocked(Boolean(userEmail));

      const {data} = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
      if (data) {
        const prefilledName =
          (typeof data.full_name === 'string' && data.full_name.trim()) ||
          (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
          (typeof metadata.name === 'string' && metadata.name.trim()) ||
          '';
        const prefilledPhone =
          (typeof data.phone === 'string' && data.phone.trim()) ||
          (typeof metadata.phone === 'string' && metadata.phone.trim()) ||
          '';
        const fallbackEmail =
          userEmail ||
          (typeof metadata.email === 'string' ? metadata.email : '');

        setFullName(prefilledName);
        setPhone(prefilledPhone);
        if (fallbackEmail) {
          setEmail(fallbackEmail);
          setIsEmailLocked(true);
        }
        setHasVerifiedIdentity(data.is_verified === true && data.verification_status === 'verified');

        const requirements = (data.stripe_requirements_due ?? {}) as {
          personal_info?: { primary_city?: string | null };
          services_and_skills?: {
            experience_range?: string | null;
            optional_link?: string | null;
            availability?: string[] | null;
          };
          areas_served?: { radius?: string | null };
        };

        const primaryCityValue =
          requirements.personal_info?.primary_city?.trim() ||
          (typeof data.city === 'string' ? data.city.trim() : '') ||
          (typeof data.locality === 'string' ? data.locality.trim() : '');
        if (primaryCityValue) {
          if (IRISH_CITIES.includes(primaryCityValue)) {
            setPrimaryCity(primaryCityValue);
          } else {
            setPrimaryCity('Other');
            setOtherPrimaryCity(primaryCityValue);
          }
        }

        setExperienceRange(requirements.services_and_skills?.experience_range ?? '');
        setOptionalLink(requirements.services_and_skills?.optional_link ?? '');

        const existingAvailability = requirements.services_and_skills?.availability ?? [];
        const knownAvailability = existingAvailability.filter((slot) => AVAILABILITY_OPTIONS.includes(slot));
        const customAvailability = existingAvailability.find((slot) => !AVAILABILITY_OPTIONS.includes(slot));
        setAvailabilitySelections(customAvailability ? [...knownAvailability, 'Other'] : knownAvailability);
        setOtherAvailability(customAvailability ?? '');

        setRadius(requirements.areas_served?.radius ?? '');

        const hasReusablePersonalInfo =
          Boolean(prefilledName) && Boolean(prefilledPhone) && Boolean(fallbackEmail);

        if (hasReusablePersonalInfo) {
          setSkipPersonalInfoStep(true);
          setStep(2);
          setPrefillNotice(
            'Your profile details were auto-filled. Please review and continue with provider details.'
          );
        }
      } else {
        const prefilledName =
          (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
          (typeof metadata.name === 'string' && metadata.name.trim()) ||
          '';
        const prefilledPhone = typeof metadata.phone === 'string' ? metadata.phone.trim() : '';
        if (prefilledName) setFullName(prefilledName);
        if (prefilledPhone) setPhone(prefilledPhone);
      }

      const { data: existingDocs } = await supabase
        .from('pro_documents')
        .select('document_type,verification_status')
        .eq('profile_id', user.id);

      setHasExistingIdDocument(
        (existingDocs ?? []).some(
          (doc) =>
            doc.document_type === 'id_verification' &&
            (doc.verification_status === 'pending' || doc.verification_status === 'verified')
        )
      );
      setHasExistingInsuranceDocument(
        (existingDocs ?? []).some(
          (doc) =>
            doc.document_type === 'public_liability_insurance' &&
            (doc.verification_status === 'pending' || doc.verification_status === 'verified')
        )
      );

      const { data: existingServices } = await supabase
        .from('pro_services')
        .select('category_id')
        .eq('profile_id', user.id);
      setSelectedServiceIds((existingServices ?? []).map((service) => service.category_id).filter(Boolean));

      const { data: existingAreas } = await supabase
        .from('pro_service_areas')
        .select('county')
        .eq('profile_id', user.id);
      setSelectedAreas((existingAreas ?? []).map((area) => area.county).filter(Boolean));

    };

    run();
  }, [router]);

  useEffect(() => {
    setSelectedServiceIds((current) =>
      current.filter((serviceId) => categories.some((item) => item.id === serviceId))
    );
  }, [categories]);

  const selectedServicesList = useMemo(() => {
    const selectedNames = categories
      .filter((item) => selectedServiceIds.includes(item.id))
      .map((item) => item.name);

    return selectedNames;
  }, [categories, selectedServiceIds]);

  const selectedAreasList = useMemo(() => selectedAreas, [selectedAreas]);
  const serviceOptions = useMemo(
    () => {
      const hasChildren = categories.some((category) => category.parent_id !== null);
      const parentNamesById = new Map(
        categories
          .filter((category) => category.parent_id === null)
          .map((category) => [category.id, category.name])
      );

      return (hasChildren ? categories.filter((category) => category.parent_id !== null) : categories)
        .map((service) => ({
          value: service.id,
          label: service.name,
          group: service.parent_id ? parentNamesById.get(service.parent_id) : undefined
        }));
    },
    [categories]
  );
  const availabilityOptions = useMemo(
    () => AVAILABILITY_OPTIONS.map((item) => ({value: item, label: item})),
    []
  );
  const countyOptions = useMemo(
    () => COUNTY_OPTIONS.map((item) => ({value: item, label: item})),
    []
  );

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

  const ensureAllowedDocFile = (file: File | null, label: 'ID' | 'insurance') => {
    if (!file) return '';
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
      return `${label} document must be PDF, PNG, JPG or JPEG.`;
    }
    return '';
  };

  const getStepValidationError = (targetStep: Step) => {
    if (targetStep === 1) {
      if (skipPersonalInfoStep) return '';
      if (!fullName.trim()) {
        return 'Please enter your full name.';
      }
      if (!isValidEnglishFullName(fullName)) {
        return 'Full name must contain English letters only.';
      }
      if (!hasAtLeastTwoNameParts(fullName)) {
        return 'Enter at least first name and last name.';
      }
      if (!isValidIrishPhone(phone)) {
        return 'Enter a valid Irish mobile number (830446082, 0830446082, or +353830446082).';
      }
      if (!resolvedPrimaryCity) {
        return t('errors.cityRequired');
      }
    }

    if (targetStep === 2) {
      if (selectedServiceIds.length === 0) {
        return t('errors.serviceRequired');
      }
      if (isFallback || selectedServiceIds.some((value) => !UUID_PATTERN.test(value))) {
        return 'Service categories are temporarily unavailable. Please retry in a moment.';
      }
      if (!experienceRange) {
        return t('errors.experienceRequired');
      }
      if (!availabilitySelections.length) {
        return t('errors.availabilityRequired');
      }
      if (availabilitySelections.includes('Other') && !otherAvailability.trim()) {
        return t('errors.otherAvailabilityRequired');
      }
    }

    if (targetStep === 3) {
      if (!selectedAreas.length) {
        return t('errors.areaRequired');
      }
      if (!radius) {
        return t('errors.radiusRequired');
      }
    }

    if (targetStep === 4) {
      if (!hasVerifiedIdentity && !idDocument && !hasExistingIdDocument) {
        return t('missingDoc');
      }
      if (!insuranceDocument && !hasExistingInsuranceDocument) {
        return t('missingInsuranceDoc');
      }
      const idTypeError = ensureAllowedDocFile(idDocument, 'ID');
      if (idTypeError) return idTypeError;
      const insuranceTypeError = ensureAllowedDocFile(insuranceDocument, 'insurance');
      if (insuranceTypeError) return insuranceTypeError;
    }

    return '';
  };

  const validateStep = (targetStep: Step) => {
    const validationError = getStepValidationError(targetStep);
    if (validationError) {
      setError(validationError);
      return false;
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
    setStep((prev) => {
      if (skipPersonalInfoStep && prev === 2) return 2;
      return prev > 1 ? ((prev - 1) as Step) : prev;
    });
  };

  const uploadDocument = async (
    userId: string,
    file: File,
    type: 'id_verification' | 'public_liability_insurance'
  ) => {
    const supabase = getSupabaseBrowserClient();
    const path =
      type === 'id_verification'
        ? `id-verifications/${userId}/${Date.now()}-${file.name}`
        : `pro-documents/${userId}/${Date.now()}-${file.name}`;

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
    return path;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (
      (!skipPersonalInfoStep && !validateStep(1)) ||
      !validateStep(2) ||
      !validateStep(3) ||
      !validateStep(4)
    )
      return;

    const supabase = getSupabaseBrowserClient();
    const {
      data: {user}
    } = await supabase.auth.getUser();

    if (!user) {
      setError(t('needLogin'));
      router.replace(`/login`);
      return;
    }

    try {
      setIsPending(true);
      let uploadedIdPath: string | null = null;

      if (idDocument) {
        uploadedIdPath = await uploadDocument(user.id, idDocument, 'id_verification');
      }

      if (insuranceDocument) {
        await uploadDocument(user.id, insuranceDocument, 'public_liability_insurance');
      }

      const {error: profileError} = await supabase
        .from('profiles')
        .update({
            full_name: fullName.trim(),
            phone: normalizeIrishPhone(phone),
          verification_status: hasVerifiedIdentity ? 'verified' : 'pending',
          id_verification_status: hasVerifiedIdentity ? 'approved' : 'pending',
          id_verification_document_url: uploadedIdPath,
          id_verification_submitted_at: idDocument ? new Date().toISOString() : null,
          id_verification_rejected_reason: null,
          is_verified: hasVerifiedIdentity,
          stripe_requirements_due: {
            application_status: 'submitted',
            submitted_at: new Date().toISOString(),
            personal_info: {
                full_name: fullName.trim() || null,
                email,
                phone: normalizeIrishPhone(phone),
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
              id_document_uploaded: hasVerifiedIdentity || !!idDocument || hasExistingIdDocument,
              insurance_document_uploaded: !!insuranceDocument || hasExistingInsuranceDocument
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
    } catch (err) {
      const details =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as {message: unknown}).message)
            : '';
      setError(details ? `${t('submitError')} (${details})` : t('submitError'));
    } finally {
      setIsPending(false);
    }
  };

  const currentStepError = getStepValidationError(step);

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
        {!isSubmitted && prefillNotice ? <div className={styles.toast}>{prefillNotice}</div> : null}
        {error ? <div className={styles.error}>{error}</div> : null}
        {!isSubmitted && categoryNotice ? <p className={styles.muted}>{categoryNotice}</p> : null}
        <div className={styles.guidelinesCard}>
          <p className={styles.guidelinesTitle}>Provider rules snapshot</p>
          <ul className={styles.guidelinesList}>
            <li>Use one account and keep your profile details accurate.</li>
            <li>Only offer legal services you are qualified to perform in Ireland.</li>
            <li>No off-platform payment or contact sharing for active jobs.</li>
            <li>Accepted offers must keep the agreed total price.</li>
          </ul>
          <a href="/community-guidelines" className={styles.guidelinesLink}>
            Read full Community Guidelines
          </a>
        </div>

        {isSubmitted ? (
          <div className={styles.field}>
            <h2>{t('applicationFlowTitle')}</h2>
            <p className={styles.muted}>{t('applicationFlow1')}</p>
            <p className={styles.muted}>{t('applicationFlow2')}</p>
            <p className={styles.muted}>{t('applicationFlow3')}</p>
            <p className={styles.muted}>{t('prodReminder')}</p>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={() => router.push(`/profile`)}>
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
                    <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
                  </label>
                  <label className={styles.field}>
                    <span>{t('form.email')}</span>
                    <input
                      value={email}
                      readOnly={isEmailLocked}
                      onChange={(event) => {
                        if (!isEmailLocked) setEmail(event.target.value);
                      }}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>{t('form.phone')}</span>
                      <input
                        value={phone}
                        onChange={(event) => setPhone(sanitizePhoneInput(event.target.value))}
                        inputMode="tel"
                        placeholder="830446082"
                      />
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
                  <MultiSelectDropdown
                    label={t('form.primaryServices')}
                    options={serviceOptions}
                    selectedValues={selectedServiceIds}
                    placeholder="Select services"
                    disabled={isLoadingCategories || serviceOptions.length === 0}
                    emptyMessage="No services are available right now. Please refresh and try again."
                    onToggle={(value) => toggleSelection(selectedServiceIds, value, setSelectedServiceIds)}
                  />

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

                  <MultiSelectDropdown
                    label={t('form.availability')}
                    options={availabilityOptions}
                    selectedValues={availabilitySelections}
                    placeholder="Select availability"
                    onToggle={(value) =>
                      toggleSelection(availabilitySelections, value, setAvailabilitySelections)
                    }
                  />
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
                  <MultiSelectDropdown
                    label={t('form.secondaryAreas')}
                    options={countyOptions}
                    selectedValues={selectedAreas}
                    placeholder="Select service areas"
                    onToggle={(value) => toggleSelection(selectedAreas, value, setSelectedAreas)}
                  />

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
                    {hasVerifiedIdentity ? (
                      <small className={styles.muted}>
                        Existing verified identity found. ID upload is not required again.
                      </small>
                    ) : (
                      <>
                        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setIdDocument(event.target.files?.[0] ?? null)} />
                        {hasExistingIdDocument ? <small className={styles.muted}>Existing ID document found.</small> : null}
                      </>
                    )}
                  </label>
                  <label className={styles.field}>
                    <span>{t('insuranceDoc')}</span>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setInsuranceDocument(event.target.files?.[0] ?? null)} />
                    {hasExistingInsuranceDocument ? <small className={styles.muted}>Existing insurance document found.</small> : null}
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
                  <button type="button" className={styles.primary} onClick={next} disabled={Boolean(currentStepError)}>
                    {t('next')}
                  </button>
                ) : (
                  <button type="submit" className={styles.primary} disabled={isPending || Boolean(currentStepError)}>
                    {isPending ? t('submitting') : t('submit')}
                  </button>
                )}
              </div>
              {currentStepError ? <p className={styles.error}>{currentStepError}</p> : null}
            </form>
          </>
        )}
      </section>
    </main>
  );
}

