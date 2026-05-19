import { getLocalizedValue } from '@growth-world/shared';
import { useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Dumbbell,
  MapPin,
  Mars,
  Scale,
  Search,
  SlidersHorizontal,
  Venus,
  Waves,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createSearchParams, Link, useNavigate } from 'react-router-dom';

import { HorizontalCarousel } from '../../../components/shared/HorizontalCarousel';
import { ListingCard, type ListingCardData } from '../../../components/shared/ListingCard';
import i18n from '../../../i18n';
import { useSEO } from '../../../hooks/useSEO';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAuthStore } from '../../../store/authStore';
import { formatCurrency } from '../../../utils/formatters';
import { getListingCity, getListingName } from '../../../utils/listing';
import { resolveUploadUrl } from '../../../utils/resolveUploadUrl';
import {
  COMPARE_MAX_ITEMS,
  COMPARE_MIN_ITEMS,
  useCompareStore,
} from '../../compare/compareStore';
import {
  fetchCategories,
  fetchFeaturedListings,
  fetchListings,
} from '../../listings/api/listingsApi';
import { mapListingToCard } from '../../listings/utils/mapListingToCard';
import { CategoryBrowseTile } from './CategoryBrowseTile';
import {
  HOME_HERO_IMAGE,
  HOME_HERO_IMAGE_FALLBACK,
} from '../data/categoryCoverImages';
import { HOME_CITIES } from '../data/homeCities';
import styles from './HomePage.module.css';

const FEATURED_LIMIT = 8;
const DEALS_LIMIT = 10;
const COMPARE_CANDIDATE_LIMIT = 3;
const DURATION_FILTERS = [
  { key: 'month', labelKey: 'homeDurationMonth' },
  { key: 'quarter', labelKey: 'homeDurationQuarter' },
  { key: 'halfYear', labelKey: 'homeDurationHalfYear' },
  { key: 'year', labelKey: 'homeDurationYear' },
] as const;

const TYPE_FILTERS = [
  { key: 'men', labelKey: 'homeFilterMen', icon: Mars },
  { key: 'women', labelKey: 'homeFilterWomen', icon: Venus },
  { key: '24h', labelKey: 'homeFilter24h', icon: Clock3 },
  { key: 'pool', labelKey: 'homeFilterPool', icon: Waves },
  { key: 'more', labelKey: 'homeFilterMore', icon: SlidersHorizontal },
] as const;

const SORT_FILTERS = [
  { key: 'popular', labelKey: 'homeSortPopular', sort: 'rating' },
  { key: 'nearest', labelKey: 'homeSortNearest', sort: 'distance' },
  { key: 'rated', labelKey: 'homeSortRated', sort: 'rating' },
  { key: 'cheapest', labelKey: 'homeSortCheapest', sort: 'price_low' },
] as const;

export function HomePage() {
  const { t } = useTranslation('listings');
  const { currentLang } = useLanguage();
  const navigate = useNavigate();
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showGuestBanner = sessionStatus === 'ready' && !isAuthenticated;

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['listings', 'featured', FEATURED_LIMIT],
    queryFn: () => fetchFeaturedListings(FEATURED_LIMIT),
  });

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['listings', 'deals', DEALS_LIMIT],
    queryFn: () => fetchListings({ limit: DEALS_LIMIT, sort: 'rating', isPremium: true }),
  });

  useSEO({
    titleAr: i18n.getFixedT('ar')('common:appName'),
    titleEn: i18n.getFixedT('en')('common:appName'),
    descAr: i18n.getFixedT('ar')('common:tagline'),
    descEn: i18n.getFixedT('en')('common:tagline'),
    path: '/',
  });

  const featuredListings = featuredData?.listings ?? [];
  const dealListings = dealsData?.listings ?? [];
  const compareItems = useCompareStore((s) => s.items);
  const toggleCompareItem = useCompareStore((s) => s.toggleItem);
  const removeCompareItem = useCompareStore((s) => s.removeItem);
  const compareReady = compareItems.length >= COMPARE_MIN_ITEMS;
  const [heroImageSrc, setHeroImageSrc] = useState(HOME_HERO_IMAGE);
  const [selectedCity, setSelectedCity] = useState(HOME_CITIES[0]?.slug ?? '');
  const [keyword, setKeyword] = useState('');
  const [duration, setDuration] = useState<(typeof DURATION_FILTERS)[number]['key']>('month');
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]['key']>('men');
  const [sortFilter, setSortFilter] = useState<(typeof SORT_FILTERS)[number]['key']>('cheapest');

  const comparisonCandidates = (dealListings.length > 0 ? dealListings : featuredListings)
    .map(mapListingToCard)
    .slice(0, COMPARE_CANDIDATE_LIMIT);
  const compareCandidatesLoading = dealsLoading || featuredLoading;

  function onHeroImageError() {
    setHeroImageSrc((current) =>
      current === HOME_HERO_IMAGE_FALLBACK ? current : HOME_HERO_IMAGE_FALLBACK,
    );
  }

  function citySearchLabel(city: (typeof HOME_CITIES)[number]): string {
    return currentLang === 'ar' ? city.ar : city.en;
  }

  function listingMainImage(listing: ListingCardData): string | undefined {
    const image = listing.images?.find((item) => item.isMain) ?? listing.images?.[0];
    return image?.url ? resolveUploadUrl(image.url) : undefined;
  }

  const selectedCityData = HOME_CITIES.find((city) => city.slug === selectedCity) ?? HOME_CITIES[0];

  function onHeroSearch(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const params: Record<string, string> = {};
    const searchParts = [
      selectedCityData ? citySearchLabel(selectedCityData) : '',
      keyword.trim(),
    ].filter(Boolean);
    if (searchParts.length > 0) params.search = searchParts.join(' ');

    const sort = SORT_FILTERS.find((item) => item.key === sortFilter)?.sort;
    if (sort && sort !== 'distance') params.sort = sort;

    navigate({
      pathname: '/listings',
      search: createSearchParams(params).toString(),
    });
  }

  return (
    <div className={styles.root} data-testid="home-page">
      <section className={styles.hero} aria-labelledby="home-hero-heading">
        <img
          className={styles.heroBg}
          src={heroImageSrc}
          alt=""
          decoding="async"
          fetchPriority="high"
          aria-hidden
          onError={onHeroImageError}
        />
        <div className={styles.heroOverlay} aria-hidden />
        <div className={`${styles.heroInner} gwContainer`}>
          <h1 id="home-hero-heading" className={styles.heroTitle}>
            {t('heroTitle')}
          </h1>
          <p className={styles.heroSubtitle}>{t('heroSubtitle')}</p>
          <form className={styles.heroSearchCard} onSubmit={onHeroSearch}>
            <div className={styles.searchTopRow}>
              <label className={styles.citySelectWrap}>
                <span className={styles.srOnly}>{t('searchFieldCity')}</span>
                <MapPin size={18} strokeWidth={2.4} aria-hidden />
                <select
                  className={styles.citySelect}
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  {HOME_CITIES.map((city) => (
                    <option key={city.slug} value={city.slug}>
                      {citySearchLabel(city)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden />
              </label>
              <label className={styles.keywordWrap}>
                <span className={styles.srOnly}>{t('searchFieldKeyword')}</span>
                <input
                  className={styles.keywordInput}
                  type="search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={t('homeSearchPlaceholder')}
                />
                <Search size={20} strokeWidth={2.2} aria-hidden />
              </label>
            </div>

            <div className={styles.filterRow} aria-label={t('homeDurationLabel')}>
              <span className={styles.rowLabel}>
                <CalendarDays size={18} aria-hidden /> {t('homeDurationLabel')}
              </span>
              <div className={styles.filterChips}>
                {DURATION_FILTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.filterChip} ${
                      duration === item.key ? styles.filterChipActive : ''
                    }`}
                    onClick={() => setDuration(item.key)}
                  >
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterRow} aria-label={t('homeTypeLabel')}>
              <span className={styles.rowLabel}>{t('homeTypeLabel')}</span>
              <div className={styles.filterChips}>
                {TYPE_FILTERS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`${styles.filterChip} ${
                        typeFilter === item.key ? styles.filterChipActive : ''
                      }`}
                      onClick={() => setTypeFilter(item.key)}
                    >
                      <Icon size={16} strokeWidth={2.2} aria-hidden />
                      {t(item.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.sortRow} aria-label={t('sortBy')}>
              <button type="button" className={styles.sortMenuButton}>
                <ChevronDown size={16} aria-hidden />
                {t('sortBy')}
              </button>
              <div className={styles.sortChips}>
                {SORT_FILTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.sortChip} ${
                      sortFilter === item.key ? styles.sortChipActive : ''
                    }`}
                    onClick={() => setSortFilter(item.key)}
                  >
                    {item.key === 'cheapest' ? <Dumbbell size={14} aria-hidden /> : null}
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className={styles.heroSubmit}>
              {t('heroSearchBtn')}
              <Search size={20} strokeWidth={2.2} aria-hidden />
            </button>
          </form>
        </div>
      </section>

      <div className={`${styles.content} gwContainer`}>
        <section className={styles.offers} aria-labelledby="home-offers-heading">
          <div className={styles.compareCard}>
            <div className={styles.compareIntro}>
              <span className={styles.compareKicker}>
                <Scale size={18} aria-hidden />
                {t('homeCompareKicker')}
              </span>
              <h2 id="home-offers-heading" className={styles.compareTitle}>
                {t('homeCompareTitle')}
              </h2>
              <p className={styles.compareDesc}>{t('homeCompareDesc')}</p>
              <p className={styles.compareHint}>{t('homeCompareMoreHint')}</p>
              <div className={styles.compareStats} aria-label={t('homeCompareCounter', { count: compareItems.length })}>
                <span>{t('homeCompareCounter', { count: compareItems.length })}</span>
                <span>{t('homeCompareLimit')}</span>
              </div>
            </div>

            <div className={styles.comparePanel}>
              <div className={styles.compareSelected}>
                {Array.from({ length: COMPARE_MAX_ITEMS }).map((_, index) => {
                  const item = compareItems[index];
                  const imageUrl = item ? listingMainImage(item) : undefined;
                  return item ? (
                    <div key={item.slug} className={styles.compareSelectedItem}>
                      {imageUrl ? (
                        <img src={imageUrl} alt="" loading="lazy" />
                      ) : (
                        <span className={styles.compareImageFallback} aria-hidden>
                          <Scale size={18} />
                        </span>
                      )}
                      <span>{getListingName(item, currentLang)}</span>
                      <button
                        type="button"
                        onClick={() => removeCompareItem(item.slug)}
                        aria-label={t('homeCompareRemove', {
                          name: getListingName(item, currentLang),
                        })}
                      >
                        <X size={14} strokeWidth={2.4} aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <div key={`empty-${index}`} className={styles.compareSelectedEmpty}>
                      {t('homeCompareEmptySlot')}
                    </div>
                  );
                })}
              </div>

              <div className={styles.compareCandidates}>
                {compareCandidatesLoading
                  ? Array.from({ length: COMPARE_CANDIDATE_LIMIT }).map((_, index) => (
                      <div
                        key={`compare-loading-${index}`}
                        className={`${styles.compareClubCard} ${styles.compareClubCardSkeleton}`}
                        aria-hidden
                      />
                    ))
                  : comparisonCandidates.map((listing) => {
                  const selected = compareItems.some((item) => item.slug === listing.slug);
                  const disabled = !selected && compareItems.length >= COMPARE_MAX_ITEMS;
                  const imageUrl = listingMainImage(listing);
                  const price = listing.packages[0]?.price;

                  return (
                    <button
                      key={listing.slug}
                      type="button"
                      className={`${styles.compareClubCard} ${
                        selected ? styles.compareClubCardActive : ''
                      }`}
                      onClick={() => toggleCompareItem(listing)}
                      disabled={disabled}
                      aria-pressed={selected}
                    >
                      {imageUrl ? (
                        <img className={styles.compareClubImage} src={imageUrl} alt="" loading="lazy" />
                      ) : (
                        <span className={styles.compareClubPlaceholder} aria-hidden>
                          <Scale size={24} />
                        </span>
                      )}
                      <span className={styles.compareClubInfo}>
                        <strong>{getListingName(listing, currentLang)}</strong>
                        <span>{getListingCity(listing, currentLang)}</span>
                      </span>
                      <span className={styles.compareClubMeta}>
                        {listing.averageRating ? (
                          <span>{listing.averageRating.toFixed(1)}</span>
                        ) : null}
                        {price != null ? <span>{formatCurrency(price, currentLang)}</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!compareCandidatesLoading && comparisonCandidates.length === 0 ? (
                <p className={styles.compareNoResults}>{t('homeCompareNoResults')}</p>
              ) : null}

              <div className={styles.compareActions}>
                {compareReady ? (
                  <Link className={styles.comparePrimary} to="/compare">
                    {t('homeCompareAction')}
                  </Link>
                ) : (
                  <button type="button" className={styles.comparePrimary} disabled>
                    {t('homeCompareAction')}
                  </button>
                )}
                <Link className={styles.compareSecondary} to="/listings">
                  {t('homeCompareBrowseMore')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="home-browse-heading">
          <h2 id="home-browse-heading" className={styles.sectionTitle}>
            {t('browseByType')}
          </h2>
          <ul className={styles.browseGrid}>
            {categories.slice(0, 4).map((c) => (
              <li key={`browse-${c._id}`}>
                <CategoryBrowseTile
                  slug={c.slug}
                  imageFromApi={c.image}
                  labelClassName={styles.categoryTileLabel}
                  to={{
                    pathname: '/listings',
                    search: createSearchParams({ category: c.slug }).toString(),
                  }}
                >
                  {getLocalizedValue(c.name, currentLang)}
                </CategoryBrowseTile>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="home-featured-heading">
          <h2 id="home-featured-heading" className={styles.sectionTitle}>
            {t('featuredUnique')}
          </h2>
          <HorizontalCarousel ariaLabel={t('featuredUnique')}>
            {featuredLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <ListingCard key={`feat-sk-${i}`} skeleton variant="grid" />
                ))
              : featuredListings.map((item) => (
                  <ListingCard key={item._id} listing={mapListingToCard(item)} variant="grid" />
                ))}
          </HorizontalCarousel>
        </section>

        {showGuestBanner ? (
          <section className={styles.guestBanner} aria-labelledby="home-guest-heading">
            <div className={styles.guestBannerInner}>
              <div>
                <h2 id="home-guest-heading" className={styles.guestTitle}>
                  {t('guestSignInBannerTitle')}
                </h2>
                <p className={styles.guestDesc}>{t('guestSignInBannerDesc')}</p>
              </div>
              <Link className={styles.guestCta} to="/login">
                {t('guestSignInBannerCta')}
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
