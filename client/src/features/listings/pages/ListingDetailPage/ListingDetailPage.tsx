import { getLocalizedValue } from '@growth-world/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Accordion } from '../../../../components/shared/Accordion';
import { ScoreBadge } from '../../../../components/shared/ScoreBadge';
import { getSiteUrl } from '../../../../config/publicEnv';
import { useJsonLd, useSEO } from '../../../../hooks/useSEO';
import { useLanguage } from '../../../../hooks/useLanguage';
import i18n from '../../../../i18n';
import { buildListingJsonLd } from '../../../../utils/listingJsonLd';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { ListingsApiError, fetchListingBySlug } from '../../api/listingsApi';
import { formatCurrency } from '../../../../utils/formatters';
import { FavoriteButton } from '../../../favorites/components/FavoriteButton/FavoriteButton';
import { RatingSummary } from '../../../reviews/components/RatingSummary/RatingSummary';
import { ReviewForm } from '../../../reviews/components/ReviewForm/ReviewForm';
import { ReviewsList } from '../../../reviews/components/ReviewsList/ReviewsList';
import { getListingCity, getListingName } from '../../../../utils/listing';
import { ListingGallery } from '../../components/ListingGallery';
import { ListingSectionNav } from '../../components/ListingSectionNav';
import { ReservationCard } from '../../components/ReservationCard';
import { WEEK_DAYS } from '../../constants/operatingHours';
import styles from './ListingDetailPage.module.css';

const AMENITY_GROUPS: { key: string; labelKey: string; keys: string[] }[] = [
  {
    key: 'wellness',
    labelKey: 'facilitiesGroupWellness',
    keys: ['pool', 'sauna'],
  },
  {
    key: 'access',
    labelKey: 'facilitiesGroupAccess',
    keys: [
      'wifi',
      'parking',
      'elevator',
      'prayer_room',
      'women_section',
      'men_section',
      'family_section',
      'disabled_access',
    ],
  },
  {
    key: 'services',
    labelKey: 'facilitiesGroupServices',
    keys: [
      'locker',
      'shower',
      'cafe',
      'ac',
      'towel_service',
      'personal_trainer',
      'nutrition_coaching',
      'group_classes',
    ],
  },
];

export function ListingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('listings');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const contactRef = useRef<HTMLElement>(null);
  const [dimensionAverages, setDimensionAverages] = useState<{
    staff: number;
    cleanliness: number;
    facilities: number;
    value: number;
  } | null>(null);

  const { data: listing, isLoading, isError, error } = useQuery({
    queryKey: ['listing', slug],
    queryFn: () => fetchListingBySlug(slug!),
    enabled: Boolean(slug),
  });

  const path = slug ? `/listings/${slug}` : '/listings';
  const appNameAr = i18n.getFixedT('ar')('common:appName');
  const appNameEn = i18n.getFixedT('en')('common:appName');
  const nameAr = listing ? getLocalizedValue(listing.name, 'ar') : '';
  const nameEn = listing ? getLocalizedValue(listing.name, 'en') : '';
  const descAr = listing
    ? (
        getLocalizedValue(listing.shortDescription, 'ar') ||
        getLocalizedValue(listing.description, 'ar')
      ).slice(0, 220)
    : i18n.getFixedT('ar')('common:tagline');
  const descEn = listing
    ? (
        getLocalizedValue(listing.shortDescription, 'en') ||
        getLocalizedValue(listing.description, 'en')
      ).slice(0, 220)
    : i18n.getFixedT('en')('common:tagline');

  useSEO({
    titleAr: listing && slug ? `${nameAr} | ${appNameAr}` : appNameAr,
    titleEn: listing && slug ? `${nameEn} | ${appNameEn}` : appNameEn,
    descAr,
    descEn,
    path,
  });

  const listingJsonLd = useMemo(() => {
    if (!listing || !slug) return null;
    const base = (getSiteUrl() ||
      (typeof window !== 'undefined' ? window.location.origin : '')) as string;
    const origin = base.replace(/\/$/, '');
    const canonicalUrl = `${origin}/listings/${slug}`;
    const name = getLocalizedValue(listing.name, currentLang);
    const description = (
      getLocalizedValue(listing.shortDescription, currentLang) ||
      getLocalizedValue(listing.description, currentLang)
    ).slice(0, 280);
    return buildListingJsonLd({ listing, canonicalUrl, name, description });
  }, [listing, slug, currentLang]);

  useJsonLd(listingJsonLd);

  const faqItems = useMemo(
    () => [
      { id: '1', question: t('faqQ1'), answer: t('faqA1') },
      { id: '2', question: t('faqQ2'), answer: t('faqA2') },
      { id: '3', question: t('faqQ3'), answer: t('faqA3') },
    ],
    [t],
  );

  if (!slug) {
    return <p className={styles.error}>{t('listingNotFound')}</p>;
  }

  if (isLoading) {
    return (
      <div className={styles.shell}>
        <div className="gwContainer">
          <div className={styles.skeletonGallery} />
          <div className={styles.skeletonBody}>
            <div className={styles.skeletonMain} />
            <div className={styles.skeletonAside} />
          </div>
        </div>
      </div>
    );
  }

  if (
    isError &&
    error instanceof ListingsApiError &&
    (error.status === 404 || error.status === 400)
  ) {
    return (
      <div className={`${styles.shell} ${styles.errorShell}`}>
        <div className={styles.errorCard}>
          <p className={styles.error}>{t('listingNotFound')}</p>
          <Link className={styles.backLink} to="/listings">
            ← {t('backToSearch')}
          </Link>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className={`${styles.shell} ${styles.errorShell}`}>
        <div className={styles.errorCard}>
          <p className={styles.error}>
            {error instanceof ListingsApiError
              ? getApiErrorMessage(error, tErrors)
              : t('listingError')}
          </p>
          <Link className={styles.backLink} to="/listings">
            ← {t('backToSearch')}
          </Link>
        </div>
      </div>
    );
  }

  const name = getListingName(listing, currentLang);
  const city = getListingCity(listing, currentLang);
  const desc = getLocalizedValue(listing.description, currentLang);
  const short = getLocalizedValue(listing.shortDescription, currentLang);
  const sortedImages = [...(listing.images ?? [])].sort(
    (a, b) => Number(b.isMain) - Number(a.isMain),
  );
  const activePackages = (listing.packages ?? []).filter((p) => p.isActive !== false);
  const cheapestPrice =
    activePackages.length > 0
      ? Math.min(...activePackages.map((p) => p.price))
      : null;

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const goToCheckout = (packageId?: string) => {
    if (!slug) return;
    if (activePackages.length === 0) {
      scrollToContact();
      return;
    }
    const query = packageId ? `?package=${encodeURIComponent(packageId)}` : '';
    navigate(`/listings/${slug}/checkout${query}`);
  };

  return (
    <article className={styles.shell} data-testid="listing-detail">
      <div className="gwContainer">
        <nav className={styles.breadcrumb} aria-label={tCommon('home')}>
          <Link to="/">{t('breadcrumbHome')}</Link>
          <span className={styles.breadcrumbSep} aria-hidden>
            /
          </span>
          <Link to="/listings">{t('searchTitle')}</Link>
          <span className={styles.breadcrumbSep} aria-hidden>
            /
          </span>
          <span className={styles.breadcrumbCurrent}>{name}</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{name}</h1>
            <FavoriteButton listingSlug={slug} />
          </div>
          <div className={styles.heroMeta}>
            <span className={styles.metaChip}>
              <MapPin size={14} strokeWidth={2} aria-hidden className={styles.metaChipIcon} />
              {city} — {getLocalizedValue(listing.location.district, currentLang)}
            </span>
            {(listing.averageRating ?? 0) > 0 ? (
              <ScoreBadge
                averageRating={listing.averageRating ?? 0}
                totalReviews={listing.totalReviews ?? 0}
                compact
              />
            ) : null}
          </div>
        </header>

        <ListingGallery images={sortedImages} listingName={name} />
        <ListingSectionNav />

        <div className={styles.bodyGrid}>
          <div className={styles.mainCol}>
            <section id="section-overview" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('detailDescription')}</h2>
              <div className={styles.sectionCard}>
                {short ? <p className={`${styles.body} ${styles.lead}`}>{short}</p> : null}
                <p className={styles.body}>{desc}</p>
                {listing.location.googleMapsUrl ? (
                  <div className={styles.locationRow}>
                    <p className={styles.locationLine}>
                      <MapPin size={16} strokeWidth={2} aria-hidden className={styles.locationIcon} />
                      {city} — {getLocalizedValue(listing.location.district, currentLang)}
                    </p>
                    <a
                      className={styles.mapLink}
                      href={listing.location.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      data-testid="listing-detail-maps-link"
                    >
                      {tCommon('showOnMap')}
                    </a>
                  </div>
                ) : null}
              </div>
            </section>

            {activePackages.length > 0 ? (
              <section id="section-packages" className={styles.section}>
                <h2 className={styles.sectionTitle}>{t('detailPackages')}</h2>
                <div className={styles.sectionCard}>
                  <div className={styles.tableWrap}>
                  <table className={styles.packagesTable}>
                    <thead>
                      <tr>
                        <th scope="col">{t('packageTableName')}</th>
                        <th scope="col">{t('packageTableFeatures')}</th>
                        <th scope="col">{t('packageTablePrice')}</th>
                        <th scope="col">{t('packageTableAction')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePackages.map((pkg) => (
                        <tr key={pkg._id}>
                          <td>
                            <strong>{getLocalizedValue(pkg.name, currentLang)}</strong>
                            <div className={styles.pkgDuration}>{t(`duration.${pkg.duration}`)}</div>
                          </td>
                          <td>
                            <ul className={styles.featureList}>
                              {(pkg.features ?? []).slice(0, 4).map((f, i) => (
                                <li key={i} className={styles.featureItem}>
                                  <span className={styles.featureCheck} aria-hidden>
                                    ✓
                                  </span>
                                  {getLocalizedValue(f, currentLang)}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className={styles.priceCell}>
                            {formatCurrency(pkg.price, currentLang)}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btnSecondary"
                              onClick={() => goToCheckout(pkg._id)}
                              data-testid={`select-package-${pkg._id}`}
                            >
                              {t('selectPackage')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </section>
            ) : null}

            <section id="section-facilities" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('amenitiesSection')}</h2>
              <div className={styles.sectionCard}>
              {AMENITY_GROUPS.map((group) => {
                const items = (listing.amenities ?? []).filter((k) => group.keys.includes(k));
                if (!items.length) return null;
                return (
                  <div key={group.key} className={styles.facilityGroup}>
                    <h3 className={styles.facilityGroupTitle}>{t(group.labelKey)}</h3>
                    <ul className={styles.facilityPills}>
                      {items.map((key) => (
                        <li key={key} className={styles.facilityPill}>
                          <span className={styles.facilityPillCheck} aria-hidden>
                            ✓
                          </span>
                          {t(`amenities.${key}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              </div>
            </section>

            <section id="section-reviews" className={styles.section} data-testid="listing-reviews">
              <h2 className={styles.sectionTitle}>{t('reviewsSection')}</h2>
              <div className={styles.reviewsSection}>
              <RatingSummary
                averageRating={listing.averageRating ?? 0}
                totalReviews={listing.totalReviews ?? 0}
                breakdown={listing.ratingBreakdown ?? null}
                dimensionAverages={dimensionAverages}
              />
              <ReviewForm listingSlug={slug} />
              <ReviewsList
                listingSlug={slug}
                onDimensionAverages={setDimensionAverages}
              />
              </div>
            </section>

            <section id="section-faq" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('faqTitle')}</h2>
              <div className={styles.sectionCard}>
                <Accordion items={faqItems} />
              </div>
            </section>

            <section id="section-rules" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('houseRulesTitle')}</h2>
              <div className={styles.sectionCard}>
              <ul className={styles.rulesList}>
                <li>{t('houseRuleCheckIn')}</li>
                <li>{t('houseRulePets')}</li>
                <li>{t('houseRuleSmoking')}</li>
              </ul>
              {listing.is24Hours ? (
                <p className={styles.body}>{t('open24Hours')}</p>
              ) : (
                <table className={styles.hoursTable}>
                  <tbody>
                    {WEEK_DAYS.map((day) => {
                      const row = listing.operatingHours?.[day];
                      return (
                        <tr key={day}>
                          <th scope="row">{t(`days.${day}`)}</th>
                          <td>
                            {row?.isOpen
                              ? `${row.open ?? ''} – ${row.close ?? ''}`
                              : t('closedLabel')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              </div>
            </section>

            <section ref={contactRef} id="section-contact" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('detailContact')}</h2>
              <div className={styles.sectionCard}>
              <ul className={styles.contactGrid}>
                {listing.contact?.phone ? (
                  <li className={styles.contactItem}>
                    <span className={styles.contactIcon} aria-hidden>
                      <Phone size={16} strokeWidth={2} />
                    </span>
                    {listing.contact.phone}
                  </li>
                ) : null}
                {listing.contact?.whatsapp ? (
                  <li className={styles.contactItem}>
                    <span className={styles.contactIcon} aria-hidden>
                      <MessageCircle size={16} strokeWidth={2} />
                    </span>
                    <span>
                      {t('contactWhatsApp')}: {listing.contact.whatsapp}
                    </span>
                  </li>
                ) : null}
                {listing.contact?.email ? (
                  <li className={styles.contactItem}>
                    <span className={styles.contactIcon} aria-hidden>
                      <Mail size={16} strokeWidth={2} />
                    </span>
                    <a href={`mailto:${listing.contact.email}`}>{listing.contact.email}</a>
                  </li>
                ) : null}
                {listing.contact?.website ? (
                  <li className={styles.contactItem}>
                    <span className={styles.contactIcon} aria-hidden>
                      <Globe size={16} strokeWidth={2} />
                    </span>
                    <a href={listing.contact.website} rel="noreferrer" target="_blank">
                      {listing.contact.website}
                    </a>
                  </li>
                ) : null}
              </ul>
              </div>
            </section>
          </div>

          <div className={styles.asideCol}>
            <ReservationCard
              price={cheapestPrice}
              averageRating={listing.averageRating ?? 0}
              totalReviews={listing.totalReviews ?? 0}
              isVerified={Boolean(listing.isVerified)}
              cityLabel={city}
              onBook={() => {
                if (activePackages.length === 1) {
                  goToCheckout(activePackages[0]!._id);
                } else if (activePackages.length > 1) {
                  goToCheckout();
                } else {
                  scrollToContact();
                }
              }}
              onContact={scrollToContact}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
