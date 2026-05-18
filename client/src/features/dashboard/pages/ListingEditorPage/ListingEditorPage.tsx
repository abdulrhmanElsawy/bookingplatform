import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  hasImageUploadErrors,
  hasPendingImageUploads,
  ListingImagesStep,
  listingImagesFromDto,
  listingImagesToPayload,
  type ListingImageDraft,
} from '../../components/ListingImagesStep';
import { ensureGymOwner } from '../../../auth/utils/ensureGymOwner';
import {
  createListing,
  type CreateListingPayload,
  fetchCategories,
  fetchListingBySlug,
  type ListingDetailDto,
  updateListing,
} from '../../../listings/api/listingsApi';
import {
  applyTimesToAllOpenDays,
  countOpenDays,
  defaultHoursState,
  hoursStateFromListing,
  hoursStateToPayload,
  validateHoursState,
  weekdayPresetHoursState,
  WEEK_DAYS,
  type HoursState,
  type WeekDay,
} from '../../../listings/constants/operatingHours';
import { SelectField } from '../../../../components/shared/SelectField';
import { useLanguage } from '../../../../hooks/useLanguage';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import {
  isGoogleMapsUrlHost,
  isShortGoogleMapsLink,
  parseGoogleMapsUrl,
} from '../../../../utils/parseGoogleMapsUrl';
import styles from './ListingEditorPage.module.css';

const AMENITY_KEYS = [
  'wifi',
  'parking',
  'locker',
  'shower',
  'cafe',
  'pool',
  'sauna',
  'ac',
  'elevator',
  'prayer_room',
  'women_section',
  'men_section',
  'family_section',
  'disabled_access',
  'towel_service',
  'personal_trainer',
  'nutrition_coaching',
  'group_classes',
] as const;

const DURATIONS = ['day', 'week', 'month', 'quarter', 'year'] as const;

const TOTAL_STEPS = 8;

function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `k-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type Pkg = {
  key: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  price: string;
  duration: (typeof DURATIONS)[number];
  features: { key: string; ar: string; en: string }[];
};

function emptyPackage(): Pkg {
  return {
    key: newKey(),
    nameAr: '',
    nameEn: '',
    descAr: '',
    descEn: '',
    price: '',
    duration: 'month',
    features: [],
  };
}

function saWhatsAppOk(s: string): boolean {
  return /^05[0-9]{8}$/.test(s.trim());
}

function applyListingToForm(
  listing: ListingDetailDto,
  setters: {
    setCategoryId: (v: string) => void;
    setNameAr: (v: string) => void;
    setNameEn: (v: string) => void;
    setShortAr: (v: string) => void;
    setShortEn: (v: string) => void;
    setAddrAr: (v: string) => void;
    setAddrEn: (v: string) => void;
    setCityAr: (v: string) => void;
    setCityEn: (v: string) => void;
    setDistAr: (v: string) => void;
    setDistEn: (v: string) => void;
    setGoogleMapsUrl: (v: string) => void;
    setDescAr: (v: string) => void;
    setDescEn: (v: string) => void;
    setAmenities: (v: string[]) => void;
    setPackages: (v: Pkg[]) => void;
    setWhatsapp: (v: string) => void;
    setPhone: (v: string) => void;
    setEmail: (v: string) => void;
    setExistingStatus: (v: string) => void;
    setIs24Hours: (v: boolean) => void;
    setHoursByDay: (v: HoursState) => void;
    setListingImages: (v: ListingImageDraft[]) => void;
  },
): void {
  if (listing.category?._id) setters.setCategoryId(listing.category._id);
  setters.setNameAr(listing.name.ar);
  setters.setNameEn(listing.name.en);
  setters.setShortAr(listing.shortDescription.ar);
  setters.setShortEn(listing.shortDescription.en);
  setters.setAddrAr(listing.location.address.ar);
  setters.setAddrEn(listing.location.address.en);
  setters.setCityAr(listing.location.city.ar);
  setters.setCityEn(listing.location.city.en);
  setters.setDistAr(listing.location.district.ar);
  setters.setDistEn(listing.location.district.en);
  if (listing.location.googleMapsUrl) {
    setters.setGoogleMapsUrl(listing.location.googleMapsUrl);
  } else {
    const coords = listing.location.coordinates?.coordinates;
    if (coords && coords.length === 2) {
      setters.setGoogleMapsUrl(
        `https://maps.google.com/?q=${coords[1]},${coords[0]}`,
      );
    }
  }
  setters.setDescAr(listing.description.ar);
  setters.setDescEn(listing.description.en);
  setters.setAmenities(listing.amenities ?? []);
  if (listing.packages && listing.packages.length > 0) {
    setters.setPackages(
      listing.packages.map((p) => ({
        key: p._id || newKey(),
        nameAr: p.name.ar,
        nameEn: p.name.en,
        descAr: p.description.ar,
        descEn: p.description.en,
        price: String(p.price),
        duration: (DURATIONS.includes(p.duration as (typeof DURATIONS)[number])
          ? p.duration
          : 'month') as (typeof DURATIONS)[number],
        features: (p.features ?? []).map((f) => ({
          key: newKey(),
          ar: f.ar,
          en: f.en,
        })),
      })),
    );
  }
  setters.setWhatsapp(listing.contact?.whatsapp ?? '');
  setters.setPhone(listing.contact?.phone ?? '');
  setters.setEmail(listing.contact?.email ?? '');
  if (listing.status) setters.setExistingStatus(listing.status);
  setters.setIs24Hours(Boolean(listing.is24Hours));
  setters.setHoursByDay(hoursStateFromListing(listing.operatingHours));
  if (listing.images && listing.images.length > 0) {
    setters.setListingImages(
      listingImagesFromDto(
        listing.images.map((img) => ({
          url: img.url,
          publicId: img.publicId,
          isMain: img.isMain,
          order: img.order,
          alt: {
            ar: img.alt?.ar ?? listing.name.ar,
            en: img.alt?.en ?? listing.name.en,
          },
        })),
      ),
    );
  }
}

export function ListingEditorPage() {
  const { t } = useTranslation('dashboard');
  const { t: tList } = useTranslation('listings');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const isEn = currentLang === 'en';
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = Boolean(editId);
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [categoryId, setCategoryId] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [shortAr, setShortAr] = useState('');
  const [shortEn, setShortEn] = useState('');

  const [addrAr, setAddrAr] = useState('');
  const [addrEn, setAddrEn] = useState('');
  const [cityAr, setCityAr] = useState('الرياض');
  const [cityEn, setCityEn] = useState('Riyadh');
  const [distAr, setDistAr] = useState('');
  const [distEn, setDistEn] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);

  const [packages, setPackages] = useState<Pkg[]>([emptyPackage()]);

  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [is24Hours, setIs24Hours] = useState(false);
  const [hoursByDay, setHoursByDay] = useState<HoursState>(defaultHoursState);
  const [listingImages, setListingImages] = useState<ListingImageDraft[]>([]);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const listingQuery = useQuery({
    queryKey: ['listing-editor', editId],
    queryFn: () => fetchListingBySlug(editId!),
    enabled: isEdit,
  });

  useEffect(() => {
    void ensureGymOwner();
  }, []);

  useEffect(() => {
    if (!isEdit || !listingQuery.data || hydrated) return;
    applyListingToForm(listingQuery.data, {
      setCategoryId,
      setNameAr,
      setNameEn,
      setShortAr,
      setShortEn,
      setAddrAr,
      setAddrEn,
      setCityAr,
      setCityEn,
      setDistAr,
      setDistEn,
      setGoogleMapsUrl,
      setDescAr,
      setDescEn,
      setAmenities,
      setPackages,
      setWhatsapp,
      setPhone,
      setEmail,
      setExistingStatus,
      setIs24Hours,
      setHoursByDay,
      setListingImages,
    });
    setHydrated(true);
  }, [isEdit, listingQuery.data, hydrated]);

  const createMutation = useMutation({
    mutationFn: (body: CreateListingPayload) => createListing(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['owner-dashboard-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: CreateListingPayload) => updateListing(editId!, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['owner-dashboard-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      await queryClient.invalidateQueries({ queryKey: ['listing-editor', editId] });
    },
  });

  function toggleAmenity(key: string): void {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function validateStep(s: number): boolean {
    setFormError('');
    if (s === 1) {
      if (
        !categoryId ||
        !nameAr.trim() ||
        !nameEn.trim() ||
        !shortAr.trim() ||
        !shortEn.trim()
      ) {
        setFormError(t('completeStepFields'));
        return false;
      }
    }
    if (s === 2) {
      if (
        !addrAr.trim() ||
        !addrEn.trim() ||
        !cityAr.trim() ||
        !cityEn.trim() ||
        !distAr.trim() ||
        !distEn.trim() ||
        !googleMapsUrl.trim()
      ) {
        setFormError(t('completeStepFields'));
        return false;
      }
      const url = googleMapsUrl.trim();
      if (!isGoogleMapsUrlHost(url)) {
        setFormError(t('googleMapsUrlInvalid'));
        return false;
      }
      const parsed = parseGoogleMapsUrl(url);
      if (!parsed && !isShortGoogleMapsLink(url)) {
        setFormError(t('googleMapsUrlInvalid'));
        return false;
      }
    }
    if (s === 3) {
      if (!descAr.trim() || !descEn.trim()) {
        setFormError(t('completeStepFields'));
        return false;
      }
    }
    if (s === 4) {
      const hoursResult = validateHoursState(is24Hours, hoursByDay, { required: true });
      if (hoursResult === 'required') {
        setFormError(t('hoursRequired'));
        return false;
      }
      if (hoursResult === 'invalidRange') {
        setFormError(t('hoursInvalidRange'));
        return false;
      }
    }
    if (s === 5) {
      if (packages.length < 1) {
        setFormError(t('completeStepFields'));
        return false;
      }
      for (const p of packages) {
        const priceN = parseFloat(p.price);
        if (
          !p.nameAr.trim() ||
          !p.nameEn.trim() ||
          !p.descAr.trim() ||
          !p.descEn.trim() ||
          Number.isNaN(priceN) ||
          priceN < 0
        ) {
          setFormError(t('completeStepFields'));
          return false;
        }
      }
    }
    if (s === 6) {
      if (hasPendingImageUploads(listingImages)) {
        setFormError(t('photosStillUploading'));
        return false;
      }
      if (hasImageUploadErrors(listingImages)) {
        setFormError(t('photosUploadErrors'));
        return false;
      }
    }
    if (s === 7) {
      /* optional for draft; submit validates in handleSubmit */
    }
    return true;
  }

  function validateHoursForSubmit(status: 'draft' | 'pending'): boolean {
    if (status === 'draft') return true;
    const hoursResult = validateHoursState(is24Hours, hoursByDay, { required: true });
    if (hoursResult === 'required') {
      setFormError(t('hoursRequired'));
      return false;
    }
    if (hoursResult === 'invalidRange') {
      setFormError(t('hoursInvalidRange'));
      return false;
    }
    return true;
  }

  function updateDayHours(day: WeekDay, patch: Partial<HoursState[WeekDay]>): void {
    setHoursByDay((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }));
  }

  function buildPayload(status: 'draft' | 'pending'): CreateListingPayload {
    const mapsUrl = googleMapsUrl.trim();
    const parsed = parseGoogleMapsUrl(mapsUrl);
    const location: CreateListingPayload['location'] = {
      address: { ar: addrAr.trim(), en: addrEn.trim() },
      city: { ar: cityAr.trim(), en: cityEn.trim() },
      district: { ar: distAr.trim(), en: distEn.trim() },
      googleMapsUrl: parsed?.normalizedUrl ?? mapsUrl,
    };
    if (parsed) {
      location.coordinates = {
        type: 'Point',
        coordinates: [parsed.lng, parsed.lat],
      };
    }
    const body: CreateListingPayload = {
      category: categoryId,
      name: { ar: nameAr.trim(), en: nameEn.trim() },
      shortDescription: { ar: shortAr.trim(), en: shortEn.trim() },
      description: { ar: descAr.trim(), en: descEn.trim() },
      location,
      amenities: amenities.length > 0 ? amenities : undefined,
      languages: ['ar', 'en'],
      packages: packages.map((p) => {
        const feats = p.features
          .map((f) => ({ ar: f.ar.trim(), en: f.en.trim() }))
          .filter((f) => f.ar.length > 0 && f.en.length > 0);
        return {
          name: { ar: p.nameAr.trim(), en: p.nameEn.trim() },
          description: { ar: p.descAr.trim(), en: p.descEn.trim() },
          price: parseFloat(p.price),
          currency: 'SAR',
          duration: p.duration,
          ...(feats.length > 0 ? { features: feats } : {}),
        };
      }),
      status,
    };

    const wa = whatsapp.trim();
    const ph = phone.trim();
    const em = email.trim();
    if (wa || ph || em) {
      body.contact = {
        ...(wa ? { whatsapp: wa } : {}),
        ...(ph ? { phone: ph } : {}),
        ...(em ? { email: em } : {}),
      };
    }

    Object.assign(body, hoursStateToPayload(is24Hours, hoursByDay));

    const imagePayload = listingImagesToPayload(listingImages);
    if (imagePayload.length > 0) {
      body.images = imagePayload;
    }

    return body;
  }

  async function handleSubmit(e: FormEvent, status: 'draft' | 'pending'): Promise<void> {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');
    if (status === 'pending' && !saWhatsAppOk(whatsapp)) {
      setFormError(t('whatsappInvalid'));
      return;
    }
    if (!validateHoursForSubmit(status)) {
      return;
    }
    if (hasPendingImageUploads(listingImages)) {
      setFormError(t('photosStillUploading'));
      return;
    }
    if (hasImageUploadErrors(listingImages)) {
      setFormError(t('photosUploadErrors'));
      return;
    }
    try {
      const payload = buildPayload(status);
      if (isEdit && editId) {
        const wasActive = existingStatus === 'active';
        const result = await updateMutation.mutateAsync(payload);
        const nextStatus = typeof result.status === 'string' ? result.status : '';
        if (status === 'draft') {
          setSuccessMsg(t('listingUpdatedDraft'));
        } else if (wasActive || nextStatus === 'pending') {
          setSuccessMsg(t('listingPendingAfterEdit'));
        } else {
          setSuccessMsg(t('listingSubmitted'));
        }
      } else {
        await createMutation.mutateAsync(payload);
        setSuccessMsg(status === 'draft' ? t('listingCreatedDraft') : t('listingSubmitted'));
      }
      window.setTimeout(() => navigate('/owner/listings'), 1500);
    } catch (err) {
      setFormError(getApiErrorMessage(err, tErrors));
    }
  }

  const savePending = createMutation.isPending || updateMutation.isPending;
  const showDraftSave = !isEdit || existingStatus === 'draft';

  function goNext(): void {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goBack(): void {
    setFormError('');
    setStep((s) => Math.max(1, s - 1));
  }

  const stepLabels = [
    t('step1'),
    t('step2'),
    t('step3'),
    t('step4'),
    t('step5'),
    t('step6'),
    t('step7'),
    t('step8'),
  ];

  function renderPageShell(content: ReactNode) {
    return (
      <div className={styles.page} data-testid="listing-editor-page">
        <div className={styles.container}>
          <div className={styles.topBar}>
            <Link className={styles.backLink} to="/owner/listings">
              ←{' '}
              {t('backToMyListings', {
                defaultValue: isEn ? 'Back to my venues' : 'العودة إلى منشآتي',
              })}
            </Link>
            <header className={styles.pageHeader}>
              <h1 className={styles.title}>
                {isEdit ? t('listingEditorEditTitle') : t('listingEditorTitle')}
              </h1>
              <p className={styles.subtitle}>
                {t('listingEditorSubtitle', {
                  defaultValue: isEn
                    ? 'Complete each step to publish your venue on Growth World. Listings go live after admin approval.'
                    : 'أكمل كل خطوة لنشر منشأتك على Growth World. يُنشر الإعلان بعد موافقة الإدارة.',
                })}
              </p>
            </header>
          </div>
          {content}
        </div>
      </div>
    );
  }

  if (isEdit && listingQuery.isLoading) {
    return renderPageShell(<p className={styles.loadingWrap}>{tCommon('loading')}</p>);
  }

  if (isEdit && listingQuery.isError) {
    return renderPageShell(
      <p className={styles.error} role="alert">
        {getApiErrorMessage(listingQuery.error, tErrors)}
      </p>,
    );
  }

  return renderPageShell(
    <>
      <div
        className={styles.progress}
        role="list"
        aria-label={t('stepOf', { current: step, total: TOTAL_STEPS })}
      >
        {stepLabels.map((label, index) => {
          const n = index + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div
              key={label}
              role="listitem"
              className={`${styles.progressStep} ${done ? styles.progressDone : ''} ${active ? styles.progressActive : ''}`}
              aria-current={active ? 'step' : undefined}
            >
              <span className={styles.progressDot} aria-hidden>
                {done ? '✓' : n}
              </span>
              <span className={styles.progressLabel}>{label}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.formCard}>
        <div className={styles.stepMeta}>
          <p className={styles.stepCounter}>
            {t('stepOf', { current: step, total: TOTAL_STEPS })}
          </p>
          <h2 className={styles.stepTitle}>{stepLabels[step - 1]}</h2>
        </div>

        <p className={styles.hint}>{t('bilingualHint')}</p>

      {formError ? (
        <p className={styles.error} role="alert">
          {formError}
        </p>
      ) : null}
      {successMsg ? (
        <p className={styles.success} role="status">
          {successMsg}
        </p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {step === 1 ? (
          <div data-testid="listing-editor-step1">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="le-cat">
                {t('selectCategory')}
              </label>
              <SelectField
                id="le-cat"
                triggerClassName={styles.select}
                value={categoryId}
                onChange={setCategoryId}
                disabled={categoriesQuery.isLoading}
                placeholder={
                  categoriesQuery.isLoading ? tCommon('loading') : t('pickCategory')
                }
                options={[
                  {
                    value: '',
                    label: categoriesQuery.isLoading
                      ? tCommon('loading')
                      : t('pickCategory'),
                  },
                  ...(categoriesQuery.data
                    ?.filter((c) => c.isActive !== false)
                    .map((c) => ({
                      value: c._id,
                      label: `${c.name.ar} / ${c.name.en}`,
                    })) ?? []),
                ]}
              />
            </div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="le-nar">
                  {t('nameAr')}
                </label>
                <input
                  id="le-nar"
                  className={styles.input}
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="le-nen">
                  {t('nameEn')}
                </label>
                <input
                  id="le-nen"
                  className={styles.input}
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="le-sar">
                  {t('shortDescAr')}
                </label>
                <textarea
                  id="le-sar"
                  className={styles.textarea}
                  value={shortAr}
                  onChange={(e) => setShortAr(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="le-sen">
                  {t('shortDescEn')}
                </label>
                <textarea
                  id="le-sen"
                  className={styles.textarea}
                  value={shortEn}
                  onChange={(e) => setShortEn(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div data-testid="listing-editor-step2">
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="le-aar">
                  {t('addressAr')}
                </label>
                <input
                  id="le-aar"
                  className={styles.input}
                  value={addrAr}
                  onChange={(e) => setAddrAr(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="le-aen">
                  {t('addressEn')}
                </label>
                <input
                  id="le-aen"
                  className={styles.input}
                  value={addrEn}
                  onChange={(e) => setAddrEn(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="le-car">
                  {t('cityAr')}
                </label>
                <input
                  id="le-car"
                  className={styles.input}
                  value={cityAr}
                  onChange={(e) => setCityAr(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="le-cen">
                  {t('cityEn')}
                </label>
                <input
                  id="le-cen"
                  className={styles.input}
                  value={cityEn}
                  onChange={(e) => setCityEn(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="le-dar">
                  {t('districtAr')}
                </label>
                <input
                  id="le-dar"
                  className={styles.input}
                  value={distAr}
                  onChange={(e) => setDistAr(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="le-den">
                  {t('districtEn')}
                </label>
                <input
                  id="le-den"
                  className={styles.input}
                  value={distEn}
                  onChange={(e) => setDistEn(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="le-maps-url">
                {t('googleMapsUrl')}
              </label>
              <input
                id="le-maps-url"
                className={styles.input}
                type="url"
                inputMode="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                required
                data-testid="listing-editor-maps-url"
              />
              <p className={styles.mapsHint}>{t('googleMapsUrlHint')}</p>
              {parseGoogleMapsUrl(googleMapsUrl.trim()) ? (
                <p className={styles.mapsDetected} data-testid="maps-url-detected">
                  {t('googleMapsUrlDetected')}
                </p>
              ) : isShortGoogleMapsLink(googleMapsUrl.trim()) ? (
                <p className={styles.mapsDetected}>{t('googleMapsUrlShortOk')}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div data-testid="listing-editor-step3">
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="le-dar2">
                  {t('descriptionAr')}
                </label>
                <textarea
                  id="le-dar2"
                  className={styles.textarea}
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="le-den2">
                  {t('descriptionEn')}
                </label>
                <textarea
                  id="le-den2"
                  className={styles.textarea}
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  required
                />
              </div>
            </div>
            <p className={styles.label}>{tList('amenitiesSection')}</p>
            <div className={styles.amenities}>
              {AMENITY_KEYS.map((key) => (
                <label key={key} className={styles.check}>
                  <input
                    type="checkbox"
                    checked={amenities.includes(key)}
                    onChange={() => toggleAmenity(key)}
                  />
                  <span>
                    {tList(`amenities.${key}`)}
                    <span className={styles.amenityKey}>
                      {t('amenityKeyHint')}: {key}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div data-testid="listing-editor-step4">
            <p className={styles.hoursHint}>{t('step4Hint')}</p>
            <label className={styles.hours24}>
              <input
                type="checkbox"
                checked={is24Hours}
                onChange={(e) => setIs24Hours(e.target.checked)}
                data-testid="listing-editor-24h"
              />
              {t('open24HoursToggle')}
            </label>
            {!is24Hours ? (
              <>
                <div className={styles.hoursActions}>
                  <button
                    type="button"
                    className="btnSecondary"
                    onClick={() => setHoursByDay(weekdayPresetHoursState())}
                    data-testid="listing-editor-hours-preset"
                  >
                    {t('weekdayPreset')}
                  </button>
                  <button
                    type="button"
                    className="btnSecondary"
                    onClick={() => setHoursByDay((prev) => applyTimesToAllOpenDays(prev))}
                    data-testid="listing-editor-hours-apply-all"
                  >
                    {t('applyToAllDays')}
                  </button>
                </div>
                <div className={styles.hoursGrid} role="group" aria-label={tList('openingHours')}>
                  {WEEK_DAYS.map((day) => {
                    const row = hoursByDay[day];
                    return (
                      <div key={day} className={styles.hoursRow} data-testid={`listing-editor-hours-${day}`}>
                        <span className={styles.hoursDayLabel}>{tList(`days.${day}`)}</span>
                        <label className={styles.hoursOpenCheck}>
                          <input
                            type="checkbox"
                            checked={row.isOpen}
                            onChange={(e) =>
                              updateDayHours(day, {
                                isOpen: e.target.checked,
                                ...(e.target.checked ? {} : { open: '', close: '' }),
                              })
                            }
                          />
                          {t('dayOpen')}
                        </label>
                        <div className={styles.hoursTimeField}>
                          <span className={styles.hoursTimeLabel}>{t('openTime')}</span>
                          <input
                            type="time"
                            className={styles.input}
                            value={row.open}
                            disabled={!row.isOpen}
                            onChange={(e) => updateDayHours(day, { open: e.target.value })}
                            aria-label={`${tList(`days.${day}`)} ${t('openTime')}`}
                          />
                        </div>
                        <div className={styles.hoursTimeField}>
                          <span className={styles.hoursTimeLabel}>{t('closeTime')}</span>
                          <input
                            type="time"
                            className={styles.input}
                            value={row.close}
                            disabled={!row.isOpen}
                            onChange={(e) => updateDayHours(day, { close: e.target.value })}
                            aria-label={`${tList(`days.${day}`)} ${t('closeTime')}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {step === 5 ? (
          <div data-testid="listing-editor-step5">
            {packages.map((p, idx) => (
              <div key={p.key} className={styles.package}>
                <div className={styles.packageHead}>
                  <h3 className={styles.packageTitle}>
                    {t('packages')} #{idx + 1}
                  </h3>
                  {packages.length > 1 ? (
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() =>
                        setPackages((list) => list.filter((x) => x.key !== p.key))
                      }
                    >
                      {t('removePackage')}
                    </button>
                  ) : null}
                </div>
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`${p.key}-nar`}>
                      {t('packageNameAr')}
                    </label>
                    <input
                      id={`${p.key}-nar`}
                      className={styles.input}
                      value={p.nameAr}
                      onChange={(e) =>
                        setPackages((list) =>
                          list.map((x) =>
                            x.key === p.key ? { ...x, nameAr: e.target.value } : x,
                          ),
                        )
                      }
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`${p.key}-nen`}>
                      {t('packageNameEn')}
                    </label>
                    <input
                      id={`${p.key}-nen`}
                      className={styles.input}
                      value={p.nameEn}
                      onChange={(e) =>
                        setPackages((list) =>
                          list.map((x) =>
                            x.key === p.key ? { ...x, nameEn: e.target.value } : x,
                          ),
                        )
                      }
                      required
                    />
                  </div>
                </div>
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`${p.key}-dar`}>
                      {t('packageDescAr')}
                    </label>
                    <textarea
                      id={`${p.key}-dar`}
                      className={styles.textarea}
                      value={p.descAr}
                      onChange={(e) =>
                        setPackages((list) =>
                          list.map((x) =>
                            x.key === p.key ? { ...x, descAr: e.target.value } : x,
                          ),
                        )
                      }
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`${p.key}-den`}>
                      {t('packageDescEn')}
                    </label>
                    <textarea
                      id={`${p.key}-den`}
                      className={styles.textarea}
                      value={p.descEn}
                      onChange={(e) =>
                        setPackages((list) =>
                          list.map((x) =>
                            x.key === p.key ? { ...x, descEn: e.target.value } : x,
                          ),
                        )
                      }
                      required
                    />
                  </div>
                </div>
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`${p.key}-price`}>
                      {t('price')} ({t('currencySar')})
                    </label>
                    <input
                      id={`${p.key}-price`}
                      className={styles.input}
                      type="number"
                      min={0}
                      step="1"
                      value={p.price}
                      onChange={(e) =>
                        setPackages((list) =>
                          list.map((x) =>
                            x.key === p.key ? { ...x, price: e.target.value } : x,
                          ),
                        )
                      }
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`${p.key}-dur`}>
                      {t('packageDuration')}
                    </label>
                    <SelectField
                      id={`${p.key}-dur`}
                      triggerClassName={styles.select}
                      value={p.duration}
                      onChange={(next) =>
                        setPackages((list) =>
                          list.map((x) =>
                            x.key === p.key
                              ? { ...x, duration: next as Pkg['duration'] }
                              : x,
                          ),
                        )
                      }
                      options={DURATIONS.map((d) => ({
                        value: d,
                        label: tList(`duration.${d}`),
                      }))}
                    />
                  </div>
                </div>
                <p className={styles.label}>{t('addFeature')}</p>
                {p.features.map((f) => (
                  <div key={f.key} className={styles.featureRow}>
                    <input
                      className={styles.input}
                      placeholder={t('featureAr')}
                      aria-label={t('featureAr')}
                      value={f.ar}
                      onChange={(e) =>
                        setPackages((list) =>
                          list.map((x) =>
                            x.key === p.key
                              ? {
                                  ...x,
                                  features: x.features.map((y) =>
                                    y.key === f.key ? { ...y, ar: e.target.value } : y,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                    <input
                      className={styles.input}
                      placeholder={t('featureEn')}
                      aria-label={t('featureEn')}
                      value={f.en}
                      onChange={(e) =>
                        setPackages((list) =>
                          list.map((x) =>
                            x.key === p.key
                              ? {
                                  ...x,
                                  features: x.features.map((y) =>
                                    y.key === f.key ? { ...y, en: e.target.value } : y,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() =>
                        setPackages((list) =>
                          list.map((x) =>
                            x.key === p.key
                              ? {
                                  ...x,
                                  features: x.features.filter((y) => y.key !== f.key),
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      {t('removeFeature')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btnSecondary"
                  onClick={() =>
                    setPackages((list) =>
                      list.map((x) =>
                        x.key === p.key
                          ? {
                              ...x,
                              features: [...x.features, { key: newKey(), ar: '', en: '' }],
                            }
                          : x,
                      ),
                    )
                  }
                >
                  {t('addFeature')}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btnSecondary"
              onClick={() => setPackages((list) => [...list, emptyPackage()])}
            >
              {t('addPackage')}
            </button>
          </div>
        ) : null}

        {step === 6 ? (
          <div data-testid="listing-editor-step6">
            <ListingImagesStep
              images={listingImages}
              onChange={setListingImages}
              nameAr={nameAr}
              nameEn={nameEn}
              disabled={savePending}
            />
          </div>
        ) : null}

        {step === 7 ? (
          <div data-testid="listing-editor-step7">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="le-wa">
                {t('whatsapp')}
              </label>
              <input
                id="le-wa"
                className={styles.input}
                type="tel"
                autoComplete="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="0500000000"
                aria-describedby="le-wa-hint"
              />
              <span id="le-wa-hint" className={styles.amenityKey}>
                {t('whatsappHint')}
              </span>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="le-ph">
                {t('phoneOptional')}
              </label>
              <input
                id="le-ph"
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="le-em">
                {t('emailOptional')}
              </label>
              <input
                id="le-em"
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 8 ? (
          <div data-testid="listing-editor-step8">
            <h2 className={styles.label}>{t('reviewSummary')}</h2>
            <dl className={styles.summary}>
              <dt>{t('nameAr')}</dt>
              <dd>{nameAr || '—'}</dd>
              <dt>{t('nameEn')}</dt>
              <dd>{nameEn || '—'}</dd>
              <dt>{t('selectCategory')}</dt>
              <dd>
                {categoriesQuery.data?.find((c) => c._id === categoryId)?.name.ar ?? '—'}
              </dd>
              <dt>{tList('openingHours')}</dt>
              <dd>
                {is24Hours
                  ? t('reviewHours24')
                  : t('reviewHoursDays', { count: countOpenDays(hoursByDay) })}
              </dd>
              <dt>{t('packages')}</dt>
              <dd>{String(packages.length)}</dd>
              <dt>{t('reviewImageCount')}</dt>
              <dd>
                {t('reviewImageCountValue', {
                  count: listingImages.filter((i) => i.status === 'ready').length,
                })}
              </dd>
            </dl>
          </div>
        ) : null}

        <div className={styles.nav}>
          {step > 1 ? (
            <button type="button" className={`btnSecondary ${styles.navStart}`} onClick={goBack}>
              {t('back')}
            </button>
          ) : null}
          {step < TOTAL_STEPS ? (
            <button type="button" className="btnPrimary" onClick={goNext}>
              {t('next')}
            </button>
          ) : null}
          {step === TOTAL_STEPS ? (
            <>
              {showDraftSave ? (
                <button
                  type="button"
                  className="btnSecondary"
                  disabled={savePending}
                  onClick={(e) => void handleSubmit(e, 'draft')}
                >
                  {t('saveDraft')}
                </button>
              ) : null}
              <button
                type="button"
                className="btnPrimary"
                disabled={savePending}
                onClick={(e) => void handleSubmit(e, 'pending')}
              >
                {t('submitForReview')}
              </button>
            </>
          ) : null}
        </div>
      </form>
      </div>
    </>
  );
}
