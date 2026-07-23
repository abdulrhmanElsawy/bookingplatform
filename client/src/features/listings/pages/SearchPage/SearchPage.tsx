import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  Clock3,
  Dumbbell,
  Flame,
  Mars,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import { isCategoryLive } from '@growth-world/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import { ListingCard } from '../../../../components/shared/ListingCard';
import i18n from '../../../../i18n';
import { useSEO } from '../../../../hooks/useSEO';
import { COMPARE_MAX_ITEMS, useCompareStore } from '../../../compare/compareStore';
import {
  fetchListings,
  type ListingListItemDto,
  type ListingsQueryParams,
} from '../../api/listingsApi';
import { mapListingToCard } from '../../utils/mapListingToCard';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import styles from './SearchPage.module.css';

type SortValue =
  | ''
  | 'relevance'
  | 'rating'
  | 'newest'
  | 'price_low'
  | 'price_high'
  | 'distance';

type DurationValue = 'month' | 'quarter' | 'halfYear' | 'year';
type TypeFilter = 'men' | '24h' | 'more' | null;

function readSort(raw: string | null): SortValue {
  switch (raw) {
    case 'relevance':
    case 'rating':
    case 'newest':
    case 'price_low':
    case 'price_high':
    case 'distance':
      return raw;
    default:
      return '';
  }
}

function toApiSort(sort: SortValue, hasSearch: boolean): string | undefined {
  if (sort === 'relevance' && hasSearch) return 'relevance';
  if (sort === 'rating') return 'rating';
  return undefined;
}

export function SearchPage() {
  const { t } = useTranslation('listings');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const compareItems = useCompareStore((s) => s.items);
  const toggleCompareItem = useCompareStore((s) => s.toggleItem);

  useSEO({
    titleAr: `${i18n.getFixedT('ar')('listings:searchTitle')} — ${i18n.getFixedT('ar')('common:appName')}`,
    titleEn: `${i18n.getFixedT('en')('listings:searchTitle')} — ${i18n.getFixedT('en')('common:appName')}`,
    descAr: `${i18n.getFixedT('ar')('listings:heroTitle')} — ${i18n.getFixedT('ar')('listings:heroSubtitle')}`,
    descEn: `${i18n.getFixedT('en')('listings:heroTitle')} — ${i18n.getFixedT('en')('listings:heroSubtitle')}`,
    path: `${location.pathname}${location.search}`,
  });

  const urlSearch = searchParams.get('search') ?? '';
  const urlCategory = searchParams.get('category') ?? '';
  const categoryComingSoon =
    Boolean(urlCategory.trim()) && !isCategoryLive(urlCategory.trim());
  const urlSort = readSort(searchParams.get('sort'));
  const urlPage = Math.max(1, Number(searchParams.get('page') || 1) || 1);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [mobileDurationOpen, setMobileDurationOpen] = useState(false);
  const [mobileDuration, setMobileDuration] = useState<DurationValue>('month');
  const [mobileTypeFilter, setMobileTypeFilter] = useState<TypeFilter>(null);
  const mobileSortMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileDurationMenuRef = useRef<HTMLDivElement | null>(null);

  const mobileSortOptions: Array<{ value: SortValue; label: string; icon?: 'star' | 'dumbbell' }> = [
    { value: 'distance', label: t('sortDistance') },
    { value: 'rating', label: t('homeSortRated'), icon: 'star' },
    { value: 'price_low', label: t('homeSortCheapest'), icon: 'dumbbell' },
    { value: 'relevance', label: t('homeSortPopular') },
  ];

  const selectedMobileSortLabel =
    mobileSortOptions.find((option) => option.value === urlSort)?.label ?? t('sortBy');
  const mobileDurationOptions: Array<{ value: DurationValue; label: string }> = [
    { value: 'month', label: t('homeDurationMonth') },
    { value: 'quarter', label: t('homeDurationQuarter') },
    { value: 'halfYear', label: t('homeDurationHalfYear') },
    { value: 'year', label: t('homeDurationYear') },
  ];
  const selectedMobileDurationLabel =
    mobileDurationOptions.find((option) => option.value === mobileDuration)?.label ??
    t('homeDurationMonth');

  const queryParams: ListingsQueryParams = useMemo(() => {
    const hasSearch = Boolean(urlSearch.trim());
    const sort = toApiSort(urlSort, hasSearch);
    return {
      search: urlSearch.trim() || undefined,
      category: urlCategory || undefined,
      sort,
      page: urlPage,
      limit: 12,
    };
  }, [urlSearch, urlCategory, urlSort, urlPage]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['listings', queryParams],
    queryFn: () => fetchListings(queryParams),
    enabled: !categoryComingSoon,
  });

  const listings = data?.listings ?? [];
  const total = data?.total ?? 0;
  const limit = queryParams.limit ?? 12;
  const hasMore = urlPage * limit < total;
  const hasPrev = urlPage > 1;

  function packageDurationMatches(
    listing: ListingListItemDto,
    selected: DurationValue,
  ): boolean {
    const packages = listing.packages ?? [];
    if (packages.length === 0) return false;
    return packages.some((pkg) => {
      if (selected === 'halfYear') return pkg.duration === 'quarter' || pkg.duration === 'year';
      return pkg.duration === selected;
    });
  }

  function typeFilterMatches(listing: ListingListItemDto, filter: TypeFilter): boolean {
    if (!filter) return true;
    const amenities = listing.amenities ?? [];
    if (filter === '24h') return Boolean(listing.is24Hours);
    if (filter === 'men') return !amenities.includes('women_section');
    if (filter === 'more') return Boolean(listing.isVerified);
    return true;
  }

  function firstPrice(listing: ListingListItemDto): number {
    return listing.packages?.[0]?.price ?? Number.MAX_SAFE_INTEGER;
  }

  const filteredListings = useMemo(() => {
    const durationFiltered = listings.filter((listing) =>
      packageDurationMatches(listing, mobileDuration),
    );
    const typeFiltered = durationFiltered.filter((listing) =>
      typeFilterMatches(listing, mobileTypeFilter),
    );
    const sorted = [...typeFiltered];
    if (urlSort === 'price_low') {
      sorted.sort((a, b) => firstPrice(a) - firstPrice(b));
    } else if (urlSort === 'price_high') {
      sorted.sort((a, b) => firstPrice(b) - firstPrice(a));
    } else if (urlSort === 'distance') {
      sorted.sort((a, b) => a.slug.localeCompare(b.slug));
    } else if (urlSort === 'newest') {
      sorted.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    }
    return sorted;
  }, [listings, mobileDuration, mobileTypeFilter, urlSort]);

  function applySort(sort: SortValue): void {
    const next = new URLSearchParams(searchParams);
    if (sort) next.set('sort', sort);
    else next.delete('sort');
    next.delete('page');
    setSearchParams(next);
  }

  function goPage(nextPage: number): void {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setSearchParams(next);
  }

  useEffect(() => {
    if (!mobileSortOpen && !mobileDurationOpen) return;
    function onPointerDown(event: MouseEvent): void {
      if (!mobileSortMenuRef.current?.contains(event.target as Node)) {
        setMobileSortOpen(false);
      }
      if (!mobileDurationMenuRef.current?.contains(event.target as Node)) {
        setMobileDurationOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setMobileSortOpen(false);
        setMobileDurationOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [mobileSortOpen, mobileDurationOpen]);

  const mobileSearchPanel = (
    <div className={styles.mobileSearchPanel}>
      <div className={styles.mobileChipRow}>
        <div className={styles.mobileDurationMenuWrap} ref={mobileDurationMenuRef}>
          <button
            type="button"
            className={styles.mobileChip}
            onClick={() => setMobileDurationOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={mobileDurationOpen}
          >
            <ChevronDown size={15} aria-hidden />
            {selectedMobileDurationLabel}
          </button>
          {mobileDurationOpen ? (
            <div className={styles.mobileDurationMenuList} role="menu" aria-label={t('homeDurationLabel')}>
              {mobileDurationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={mobileDuration === option.value}
                  className={`${styles.mobileDurationMenuItem} ${
                    mobileDuration === option.value ? styles.mobileDurationMenuItemActive : ''
                  }`}
                  onClick={() => {
                    setMobileDuration(option.value);
                    setMobileDurationOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className={`${styles.mobileChip} ${
            mobileTypeFilter === 'men' ? styles.mobileChipActive : ''
          }`}
          onClick={() =>
            setMobileTypeFilter((prev) => (prev === 'men' ? null : 'men'))
          }
        >
          <Mars size={16} aria-hidden />
          {t('homeFilterMen')}
        </button>
        <button
          type="button"
          className={`${styles.mobileChip} ${
            mobileTypeFilter === '24h' ? styles.mobileChipActive : ''
          }`}
          onClick={() =>
            setMobileTypeFilter((prev) => (prev === '24h' ? null : '24h'))
          }
        >
          <Clock3 size={16} aria-hidden />
          {t('homeFilter24h')}
        </button>
        <button
          type="button"
          className={`${styles.mobileChip} ${
            mobileTypeFilter === 'more' ? styles.mobileChipActive : ''
          }`}
          onClick={() =>
            setMobileTypeFilter((prev) => (prev === 'more' ? null : 'more'))
          }
        >
          <SlidersHorizontal size={16} aria-hidden />
          {t('homeFilterMore')}
        </button>
      </div>

      <div className={styles.mobileSortRow}>
        <div className={styles.mobileSortMenuWrap} ref={mobileSortMenuRef}>
          <button
            type="button"
            className={styles.mobileChip}
            onClick={() => setMobileSortOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={mobileSortOpen}
          >
            <ChevronDown size={15} aria-hidden />
            {t('sortBy')}: {selectedMobileSortLabel}
          </button>
          {mobileSortOpen ? (
            <div className={styles.mobileSortMenuList} role="menu" aria-label={t('sortBy')}>
              {mobileSortOptions.map((option) => (
                <button
                  key={option.value || 'none'}
                  type="button"
                  role="menuitemradio"
                  aria-checked={urlSort === option.value}
                  className={`${styles.mobileSortMenuItem} ${
                    urlSort === option.value ? styles.mobileSortMenuItemActive : ''
                  }`}
                  onClick={() => {
                    applySort(option.value);
                    setMobileSortOpen(false);
                  }}
                >
                  {option.icon === 'star' ? <Star size={15} aria-hidden /> : null}
                  {option.icon === 'dumbbell' ? <Dumbbell size={15} aria-hidden /> : null}
                  {!option.icon && option.value === 'relevance' ? (
                    <Flame size={15} aria-hidden />
                  ) : null}
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mobileSearchPanel}
      <div className={styles.layout} data-testid="search-page">
        <section className={styles.results}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsTitleRow}>
              <h1 className={styles.resultsTitle}>{t('searchResults')}</h1>
              <p className={styles.resultsCount}>
                {t('searchFoundPrefix')} <strong>{total}</strong> {t('searchFoundSuffix')}
              </p>
            </div>
          </div>

          {categoryComingSoon ? (
            <div className={styles.empty} data-testid="category-coming-soon">
              <p className={styles.emptyTitle}>{tCommon('categoryComingSoonTitle')}</p>
              <p className={styles.emptyDesc}>{tCommon('categoryComingSoonDesc')}</p>
              <Link className="btnPrimary" to="/listings?category=gyms">
                {tCommon('categoryComingSoonBrowseGyms')}
              </Link>
            </div>
          ) : null}

          {!categoryComingSoon && isError ? (
            <div className={styles.error} role="alert">
              <p>{getApiErrorMessage(error, tErrors)}</p>
              <button type="button" className="btnSecondary" onClick={() => void refetch()}>
                {tCommon('retry')}
              </button>
            </div>
          ) : null}

          {!categoryComingSoon && isLoading ? (
            <div className={styles.list}>
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCard key={i} skeleton variant="list" />
              ))}
            </div>
          ) : !categoryComingSoon && filteredListings.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>{t('noResultsTitle')}</p>
              <p className={styles.emptyDesc}>{t('noResultsDesc')}</p>
            </div>
          ) : !categoryComingSoon ? (
            <div className={styles.list} data-testid="search-results">
              {filteredListings.map((item) => {
                const cardListing = mapListingToCard(item);
                const selected = compareItems.some((compareItem) => compareItem.slug === cardListing.slug);
                const disabled = !selected && compareItems.length >= COMPARE_MAX_ITEMS;
                return (
                  <ListingCard
                    key={item._id}
                    listing={cardListing}
                    variant="list"
                    showDealPrice={item.isFeatured}
                    compare={{
                      selected,
                      disabled,
                      onToggle: () => toggleCompareItem(cardListing),
                    }}
                  />
                );
              })}
            </div>
          ) : null}

          {!categoryComingSoon && !isLoading && filteredListings.length > 0 && (hasPrev || hasMore) ? (
            <div className={styles.pagination}>
              {hasPrev ? (
                <button type="button" className="btnSecondary" onClick={() => goPage(urlPage - 1)}>
                  {tCommon('previous')}
                </button>
              ) : null}
              {hasMore ? (
                <button type="button" className="btnSecondary" onClick={() => goPage(urlPage + 1)}>
                  {tCommon('next')}
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

    </>
  );
}
