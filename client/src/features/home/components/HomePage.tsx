import { getLocalizedValue, isCategoryLive } from '@growth-world/shared';
import { useQuery } from '@tanstack/react-query';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Dumbbell,
  MapPin,
  Mars,
  Search,
  SlidersHorizontal,
  Venus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createSearchParams, useNavigate } from 'react-router-dom';

import { DealsSlider } from '../../../components/shared/DealsSlider';
import { ListingCard } from '../../../components/shared/ListingCard';
import i18n from '../../../i18n';
import { useSEO } from '../../../hooks/useSEO';
import { useLanguage } from '../../../hooks/useLanguage';
import {
  fetchCategories,
  fetchFeaturedListings,
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

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['listings', 'featured', FEATURED_LIMIT],
    queryFn: () => fetchFeaturedListings(FEATURED_LIMIT),
  });

  useSEO({
    titleAr: i18n.getFixedT('ar')('common:appName'),
    titleEn: i18n.getFixedT('en')('common:appName'),
    descAr: i18n.getFixedT('ar')('common:tagline'),
    descEn: i18n.getFixedT('en')('common:tagline'),
    path: '/',
  });

  const sortedCategories = [...categories].sort((a, b) => {
    const aLive = isCategoryLive(a.slug) ? 0 : 1;
    const bLive = isCategoryLive(b.slug) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const featuredListings = featuredData?.listings ?? [];
  const [heroImageSrc, setHeroImageSrc] = useState(HOME_HERO_IMAGE);
  const [selectedCity, setSelectedCity] = useState(HOME_CITIES[0]?.slug ?? '');
  const [keyword, setKeyword] = useState('');
  const [duration, setDuration] = useState<(typeof DURATION_FILTERS)[number]['key']>('month');
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]['key']>('men');
  const [sortFilter, setSortFilter] = useState<(typeof SORT_FILTERS)[number]['key']>('cheapest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  function onHeroImageError() {
    setHeroImageSrc((current) =>
      current === HOME_HERO_IMAGE_FALLBACK ? current : HOME_HERO_IMAGE_FALLBACK,
    );
  }

  function citySearchLabel(city: (typeof HOME_CITIES)[number]): string {
    return currentLang === 'ar' ? city.ar : city.en;
  }

  const selectedCityData = HOME_CITIES.find((city) => city.slug === selectedCity) ?? HOME_CITIES[0];

  function onHeroSearch(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const params: Record<string, string> = {};
    const trimmedKeyword = keyword.trim();
    // Do not force city text into free-text search, otherwise many valid city-only searches return 0 results.
    if (trimmedKeyword.length > 0) {
      params.search = selectedCityData
        ? `${trimmedKeyword} ${citySearchLabel(selectedCityData)}`
        : trimmedKeyword;
    }

    const sort = SORT_FILTERS.find((item) => item.key === sortFilter)?.sort;
    if (sort && sort !== 'distance') params.sort = sort;

    navigate({
      pathname: '/listings',
      search: createSearchParams(params).toString(),
    });
  }

  useEffect(() => {
    if (!sortMenuOpen) return;
    function onPointerDown(event: MouseEvent): void {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') setSortMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [sortMenuOpen]);

  const activeSortLabel = t(
    SORT_FILTERS.find((item) => item.key === sortFilter)?.labelKey ?? 'homeSortCheapest',
  );

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
              <div className={styles.sortMenuWrap} ref={sortMenuRef}>
                <button
                  type="button"
                  className={styles.sortMenuButton}
                  onClick={() => setSortMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={sortMenuOpen}
                >
                  <ChevronDown size={16} aria-hidden />
                  {t('sortBy')}: {activeSortLabel}
                </button>
                {sortMenuOpen ? (
                  <div className={styles.sortMenuList} role="menu" aria-label={t('sortBy')}>
                    {SORT_FILTERS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        role="menuitemradio"
                        aria-checked={sortFilter === item.key}
                        className={`${styles.sortMenuItem} ${
                          sortFilter === item.key ? styles.sortMenuItemActive : ''
                        }`}
                        onClick={() => {
                          setSortFilter(item.key);
                          setSortMenuOpen(false);
                        }}
                      >
                        {item.key === 'cheapest' ? <Dumbbell size={14} aria-hidden /> : null}
                        {t(item.labelKey)}
                      </button>
                    ))}
                  </div>
                ) : null}
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
        <section className={styles.section} aria-labelledby="home-browse-heading">
          <h2 id="home-browse-heading" className={styles.sectionTitle}>
            {t('browseByType')}
          </h2>
          <ul className={styles.browseGrid}>
            {sortedCategories.map((c) => (
              <li key={`browse-${c._id}`}>
                <CategoryBrowseTile
                  slug={c.slug}
                  imageFromApi={c.image}
                  labelClassName={styles.categoryTileLabel}
                  comingSoon={!isCategoryLive(c.slug)}
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
          <DealsSlider ariaLabel={t('featuredUnique')}>
            {featuredLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <ListingCard key={`feat-sk-${i}`} skeleton variant="grid" />
                ))
              : featuredListings.map((item) => (
                  <ListingCard key={item._id} listing={mapListingToCard(item)} variant="grid" />
                ))}
          </DealsSlider>
        </section>

      </div>
    </div>
  );
}
