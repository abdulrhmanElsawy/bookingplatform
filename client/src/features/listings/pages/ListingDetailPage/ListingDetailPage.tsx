import { getLocalizedValue } from '@growth-world/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Dumbbell,
  Gift,
  Image as ImageIcon,
  Info,
  MapPin,
  Navigation,
  Share2,
  Star,
  Ticket,
  Waves,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getSiteUrl } from '../../../../config/publicEnv';
import { useJsonLd, useSEO } from '../../../../hooks/useSEO';
import { useLanguage } from '../../../../hooks/useLanguage';
import i18n from '../../../../i18n';
import { buildListingJsonLd } from '../../../../utils/listingJsonLd';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { ListingsApiError, fetchListingBySlug } from '../../api/listingsApi';
import { formatCurrency } from '../../../../utils/formatters';
import { FavoriteButton } from '../../../favorites/components/FavoriteButton/FavoriteButton';
import { fetchReviews } from '../../../reviews/api/reviewsApi';
import { ReviewForm } from '../../../reviews/components/ReviewForm/ReviewForm';
import { getListingCity, getListingName } from '../../../../utils/listing';
import { resolveUploadUrl } from '../../../../utils/resolveUploadUrl';
import { ListingGallery } from '../../components/ListingGallery';
import {
  branchAddressLine,
  branchLabel,
  resolveListingBranches,
  sortBranchesByDistance,
} from '../../utils/listingBranches';
import styles from './ListingDetailPage.module.css';

const AMENITY_ICONS: Record<string, typeof Dumbbell> = {
  pool: Waves,
  sauna: Waves,
  personal_trainer: Dumbbell,
  group_classes: Ticket,
  locker: Building2,
  wifi: Building2,
  parking: Building2,
};

export function ListingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('listings');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { t: tReviews } = useTranslation('reviews');
  const { currentLang } = useLanguage();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
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

  const reviewsQuery = useQuery({
    queryKey: ['reviews', slug],
    queryFn: () => fetchReviews(slug!, 1, 6),
    enabled: Boolean(slug) && Boolean(listing),
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setUserCoords(null);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    const reviews = reviewsQuery.data?.reviews ?? [];
    if (!reviews.length) {
      setDimensionAverages(null);
      return;
    }
    const n = reviews.length;
    const sums = reviews.reduce(
      (acc, r) => ({
        staff: acc.staff + r.rating.staff,
        cleanliness: acc.cleanliness + r.rating.cleanliness,
        facilities: acc.facilities + r.rating.facilities,
        value: acc.value + r.rating.value,
      }),
      { staff: 0, cleanliness: 0, facilities: 0, value: 0 },
    );
    setDimensionAverages({
      staff: sums.staff / n,
      cleanliness: sums.cleanliness / n,
      facilities: sums.facilities / n,
      value: sums.value / n,
    });
  }, [reviewsQuery.data?.reviews]);

  const sortedBranches = useMemo(() => {
    if (!listing) return [];
    return sortBranchesByDistance(resolveListingBranches(listing), userCoords);
  }, [listing, userCoords]);

  useEffect(() => {
    if (!sortedBranches.length) return;
    setSelectedBranchId((prev) =>
      prev && sortedBranches.some((b) => b._id === prev) ? prev : sortedBranches[0]!._id,
    );
  }, [sortedBranches]);

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
  const selectedPackage =
    activePackages.find((pkg) => pkg._id === selectedPackageId) ??
    activePackages.find((p) => p.isPopular) ??
    activePackages[0];
  const heroImage = sortedImages[0]?.url ? resolveUploadUrl(sortedImages[0].url) : '';
  const branchCount = listing.branches?.length || sortedBranches.length;
  const nearestBranch =
    sortedBranches.find((b) => b._id === selectedBranchId) ?? sortedBranches[0];
  const otherBranches = sortedBranches.filter((b) => b._id !== nearestBranch?._id).slice(0, 4);
  const facilityItems = (listing.amenities ?? []).map((key) => ({
    key,
    label: t(`amenities.${key}`),
    icon: AMENITY_ICONS[key] ?? Dumbbell,
  }));
  const reviewItems = reviewsQuery.data?.reviews?.slice(0, 2) ?? [];
  const dimensionRows = dimensionAverages
    ? [
        { label: tReviews('cleanliness'), value: dimensionAverages.cleanliness },
        { label: tReviews('facilities'), value: dimensionAverages.facilities },
        { label: tReviews('staff'), value: dimensionAverages.staff },
        { label: tReviews('value'), value: dimensionAverages.value },
      ]
    : [];

  const branchImageUrl = (branch: (typeof sortedBranches)[number]) => {
    const img = branch.images?.[0]?.url ?? sortedImages[0]?.url;
    return img ? resolveUploadUrl(img) : heroImage;
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled share */
    }
  };

  const goToCheckout = (packageId?: string) => {
    if (!slug) return;
    if (activePackages.length === 0) {
      return;
    }
    const query = packageId ? `?package=${encodeURIComponent(packageId)}` : '';
    navigate(`/listings/${slug}/checkout${query}`);
  };

  return (
    <article className={styles.shell} data-testid="listing-detail">
      <header className={styles.detailHero}>
        {heroImage ? <img className={styles.heroImage} src={heroImage} alt="" aria-hidden /> : null}
        <div className={styles.heroShade} aria-hidden />
        <div className={styles.heroActions}>
          <Link className={styles.circleBtn} to="/listings" aria-label={t('backToSearch')}>
            <ArrowLeft size={20} aria-hidden />
          </Link>
          <div className={styles.heroActionRight}>
            <FavoriteButton listingSlug={slug} className={styles.heroFavorite} />
            <button
              type="button"
              className={styles.circleBtn}
              aria-label={t('shareListing')}
              onClick={() => void handleShare()}
            >
              <Share2 size={18} aria-hidden />
            </button>
          </div>
        </div>
        <div className={styles.heroContent}>
          <div className={styles.brandTile}>
            {heroImage ? <img src={heroImage} alt="" /> : <ImageIcon size={28} aria-hidden />}
            <span>{name}</span>
          </div>
          <div className={styles.heroText}>
            <div className={styles.heroTitleLine}>
              <h1>{name}</h1>
              {listing.isVerified ? (
                <span className={styles.verifiedChip}>{t('detailVerifiedShort')}</span>
              ) : null}
            </div>
            <div className={styles.ratingLine}>
              <span className={styles.greenRating}>
                {Number(listing.averageRating ?? 0).toFixed(1)}
                <Star size={16} fill="currentColor" aria-hidden />
              </span>
              <span>{t('common:review', { count: listing.totalReviews ?? 0 })}</span>
            </div>
            <p>
              <MapPin size={15} aria-hidden />
              {getLocalizedValue(listing.location.district, currentLang) || city}
              {'، '}
              {city}
            </p>
          </div>
        </div>
      </header>

      <nav className={styles.detailTabs} aria-label={tCommon('mainNav')}>
        {[
          { href: '#section-gallery', label: t('detailGallery'), icon: ImageIcon },
          { href: '#section-reviews', label: t('reviewsSection'), icon: Star },
          { href: '#section-branches', label: t('detailBranches'), icon: Building2 },
          { href: '#section-facilities', label: t('amenitiesSection'), icon: Dumbbell },
          { href: '#section-packages', label: t('detailPackages'), icon: CreditCard },
          { href: '#section-overview', label: t('navOverview'), icon: Info },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <a key={item.href} className={index === 0 ? styles.tabActive : styles.tabLink} href={item.href}>
              <Icon size={18} aria-hidden />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className={`${styles.detailContent} gwContainer`}>
        <section className={styles.statsStrip} aria-label={t('detailStats')}>
          <div>
            <span>{t('common:from')}</span>
            <strong>{cheapestPrice != null ? formatCurrency(cheapestPrice, currentLang) : '-'}</strong>
          </div>
          <div>
            <span>{t('detailBranchesCount')}</span>
            <strong>
              {branchCount} {t('detailBranchUnit')}
            </strong>
          </div>
          <div>
            <span>{t('openNowLabel')}</span>
            <strong>{listing.is24Hours ? t('open24Hours') : t('detailOpenHours')}</strong>
          </div>
          <div>
            <span>{t('homeTypeLabel')}</span>
            <strong>{t('homeFilterMen')}</strong>
          </div>
          <div>
            <span>{t('detailLastUpdated')}</span>
            <strong>{t('detailTwoDaysAgo')}</strong>
          </div>
        </section>

        {activePackages.length > 0 ? (
          <section id="section-packages" className={styles.detailSection}>
            <div className={styles.sectionHeading}>
              <h2>{t('detailPackages')}</h2>
              <span>{t('detailPriceNote')}</span>
            </div>
            <div className={styles.packageScroller}>
              {activePackages.map((pkg) => {
                const active = (selectedPackage?._id ?? activePackages[0]?._id) === pkg._id;
                const feature = pkg.features?.[0]
                  ? getLocalizedValue(pkg.features[0], currentLang)
                  : t(`duration.${pkg.duration}`);
                return (
                  <button
                    key={pkg._id}
                    type="button"
                    className={`${styles.packageCard} ${active ? styles.packageActive : ''}`}
                    onClick={() => setSelectedPackageId(pkg._id)}
                    data-testid={`select-package-${pkg._id}`}
                  >
                    {pkg.isPopular ? (
                      <span className={styles.bestBadge}>{t('detailBestValue')}</span>
                    ) : null}
                    <span>{getLocalizedValue(pkg.name, currentLang)}</span>
                    <strong>{formatCurrency(pkg.price, currentLang)}</strong>
                    <small>{feature}</small>
                    <small>{t('detailNoHiddenFees')}</small>
                    {active ? <CheckCircle2 className={styles.packageCheck} size={18} aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section id="section-facilities" className={styles.detailSection}>
          <div className={styles.sectionHeading}>
            <h2>{t('detailServicesFacilities')}</h2>
            <span>{t('detailSwipeMore')}</span>
          </div>
          <div className={styles.facilityTiles}>
            {facilityItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className={styles.facilityTile}>
                  <Icon size={32} aria-hidden />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section id="section-branches" className={styles.detailSection}>
          <div className={styles.sectionHeading}>
            <h2>{t('detailBranchesWithCount', { count: branchCount })}</h2>
            <strong>
              {nearestBranch?.is24Hours || listing.is24Hours
                ? t('open24Hours')
                : t('detailOpenHours')}
            </strong>
          </div>
          <div className={styles.branchesCard}>
            <div className={styles.branchMain}>
              {nearestBranch && branchImageUrl(nearestBranch) ? (
                <img src={branchImageUrl(nearestBranch)} alt="" />
              ) : null}
              {nearestBranch?.distanceKm != null ? (
                <span>{t('detailNearestToYou')}</span>
              ) : null}
            </div>
            <div className={styles.branchInfo}>
              <h3>{nearestBranch ? branchLabel(nearestBranch, currentLang) : name}</h3>
              <p>
                <MapPin size={17} aria-hidden />
                {nearestBranch
                  ? branchAddressLine(nearestBranch, currentLang)
                  : `${getLocalizedValue(listing.location.district, currentLang) || city}، ${city}`}
              </p>
              {nearestBranch?.distanceKm != null ? (
                <p>
                  {t('detailDistanceAway', {
                    distance: nearestBranch.distanceKm.toFixed(1),
                  })}
                </p>
              ) : null}
              <a
                className={styles.directionBtn}
                href={
                  nearestBranch?.googleMapsUrl ?? listing.location.googleMapsUrl ?? '#'
                }
                target="_blank"
                rel="noreferrer"
              >
                {t('detailDirections')}
                <Navigation size={18} aria-hidden />
              </a>
            </div>
            <div className={styles.branchMiniGrid}>
              {otherBranches.map((branch) => (
                <button
                  key={branch._id}
                  type="button"
                  className={styles.branchMini}
                  onClick={() => setSelectedBranchId(branch._id)}
                >
                  {branchImageUrl(branch) ? (
                    <img src={branchImageUrl(branch)} alt="" loading="lazy" />
                  ) : null}
                  <span>{branchLabel(branch, currentLang)}</span>
                  {branch.distanceKm != null ? (
                    <small>
                      {t('detailDistanceAway', {
                        distance: branch.distanceKm.toFixed(1),
                      })}
                    </small>
                  ) : null}
                </button>
              ))}
            </div>
            <div className={styles.branchCountBox}>
              <span>{t('detailAllBranches')}</span>
              <strong>{branchCount}</strong>
              <small>{t('detailBranchUnit')}</small>
            </div>
          </div>
        </section>

        <section id="section-reviews" className={styles.detailSection} data-testid="listing-reviews">
          <div className={styles.sectionHeading}>
            <h2>{t('reviewsSection')}</h2>
          </div>
          <div className={styles.reviewGrid}>
            <div className={styles.reviewScore}>
              <span>{t('common:rating')}</span>
              <strong>{Number(listing.averageRating ?? 0).toFixed(1)}</strong>
              <div className={styles.stars}>★★★★★</div>
              <small>{t('common:review', { count: listing.totalReviews ?? 0 })}</small>
            </div>
            <div className={styles.ratingBars}>
              {(dimensionRows.length
                ? dimensionRows
                : [
                    { label: t('detailCleanliness'), value: listing.averageRating ?? 0 },
                    { label: t('detailEquipment'), value: listing.averageRating ?? 0 },
                    { label: t('amenitiesSection'), value: listing.averageRating ?? 0 },
                    { label: t('detailValueForMoney'), value: listing.averageRating ?? 0 },
                  ]
              ).map((row) => (
                <div key={row.label} className={styles.ratingBar}>
                  <span>{row.label}</span>
                  <i>
                    <b style={{ inlineSize: `${(row.value / 5) * 100}%` }} />
                  </i>
                  <strong>{row.value.toFixed(1)}</strong>
                </div>
              ))}
            </div>
            {reviewItems.map((review) => (
              <article key={review._id} className={styles.reviewCard}>
                <div className={styles.reviewAvatar} aria-hidden />
                <h3>{review.title}</h3>
                <span className={styles.reviewStars}>
                  {'★'.repeat(Math.round(review.rating.overall))}
                </span>
                <p>{review.content}</p>
                {review.isVerified ? (
                  <small>
                    <CheckCircle2 size={16} aria-hidden /> {t('detailVerifiedPurchase')}
                  </small>
                ) : null}
              </article>
            ))}
          </div>
          <ReviewForm listingSlug={slug} />
        </section>

        <section id="section-gallery" className={styles.detailSection}>
          <div className={styles.sectionHeading}>
            <h2>{t('detailGallery')}</h2>
            <span>{t('detailSwipeMore')}</span>
          </div>
          {sortedImages.length > 0 ? (
            <ListingGallery images={sortedImages} listingName={name} />
          ) : null}
        </section>

        <section id="section-overview" className={styles.detailSection}>
          <div className={styles.notesGrid}>
            <div><Info size={22} aria-hidden /> {t('detailCheckBeforeSubscribe')}</div>
            <div><Gift size={22} aria-hidden /> {t('detailLimitedOffers')}</div>
            <div><Ticket size={22} aria-hidden /> {t('detailPricesByBranch')}</div>
          </div>
          {short || desc ? (
            <div className={styles.overviewCard}>
              <h2>{t('detailDescription')}</h2>
              {short ? <p>{short}</p> : null}
              {desc ? <p>{desc}</p> : null}
            </div>
          ) : null}
        </section>
      </div>

      <div className={styles.bottomCta}>
        <a
          className={styles.locationCta}
          href={
            nearestBranch?.googleMapsUrl ?? listing.location.googleMapsUrl ?? '#'
          }
          target="_blank"
          rel="noreferrer"
        >
          {t('location')}
          <MapPin size={22} aria-hidden />
        </a>
        <button
          type="button"
          className={styles.subscribeCta}
          onClick={() => goToCheckout(selectedPackage?._id)}
        >
          <ChevronLeft size={22} aria-hidden />
          <span>
            {selectedPackage
              ? t('detailSubscribeWithPrice', {
                  price: formatCurrency(selectedPackage.price, currentLang),
                })
              : t('bookNow')}
            <small>{selectedPackage ? getLocalizedValue(selectedPackage.name, currentLang) : t('detailBestValue')}</small>
          </span>
          <CreditCard size={24} aria-hidden />
        </button>
      </div>
    </article>
  );
}

