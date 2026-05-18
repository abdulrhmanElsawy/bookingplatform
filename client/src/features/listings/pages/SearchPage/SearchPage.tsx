import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';

import { ListingCard } from '../../../../components/shared/ListingCard';
import { SelectField } from '../../../../components/shared/SelectField';
import i18n from '../../../../i18n';
import { useSEO } from '../../../../hooks/useSEO';
import { useLanguage } from '../../../../hooks/useLanguage';
import { ListingsSearchStrip } from '../../components/ListingsSearchStrip/ListingsSearchStrip';
import {
  fetchCategories,
  fetchListings,
  type ListingsQueryParams,
  type ListingListItemDto,
} from '../../api/listingsApi';
import { mapListingToCard } from '../../utils/mapListingToCard';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { SearchFiltersPanel } from './SearchFiltersPanel';
import styles from './SearchPage.module.css';

const DESKTOP_QUERY = '(min-width: 900px)';
const DEFAULT_MAX_PRICE = 2000;

type SortValue =
  | ''
  | 'relevance'
  | 'rating'
  | 'newest'
  | 'price_low'
  | 'price_high'
  | 'distance';

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

function getMinPrice(item: ListingListItemDto): number {
  const prices = (item.packages ?? []).map((p) => p.price).filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : 0;
}

function useDesktopFilters(): boolean {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_QUERY).matches : true,
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setDesktop(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return desktop;
}

function countActiveFilters(
  maxPrice: number,
  filterVerified: boolean,
  filterStars: number[],
  filterCategories: string[],
  urlCategory: string,
): number {
  let count = 0;
  if (filterVerified) count += 1;
  count += filterStars.length;
  if (maxPrice < DEFAULT_MAX_PRICE) count += 1;
  const baseline = urlCategory ? [urlCategory] : [];
  const extraCats = filterCategories.filter((c) => !baseline.includes(c)).length;
  const missingBaseline = baseline.some((c) => !filterCategories.includes(c));
  if (extraCats > 0 || (baseline.length === 0 && filterCategories.length > 0)) {
    count += extraCats || filterCategories.length;
  } else if (missingBaseline) {
    count += 1;
  }
  return count;
}

export function SearchPage() {
  const { t } = useTranslation('listings');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const desktop = useDesktopFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);

  useSEO({
    titleAr: `${i18n.getFixedT('ar')('listings:searchTitle')} — ${i18n.getFixedT('ar')('common:appName')}`,
    titleEn: `${i18n.getFixedT('en')('listings:searchTitle')} — ${i18n.getFixedT('en')('common:appName')}`,
    descAr: `${i18n.getFixedT('ar')('listings:heroTitle')} — ${i18n.getFixedT('ar')('listings:heroSubtitle')}`,
    descEn: `${i18n.getFixedT('en')('listings:heroTitle')} — ${i18n.getFixedT('en')('listings:heroSubtitle')}`,
    path: `${location.pathname}${location.search}`,
  });

  const urlSearch = searchParams.get('search') ?? '';
  const urlCategory = searchParams.get('category') ?? '';
  const urlSort = readSort(searchParams.get('sort'));
  const urlPage = Math.max(1, Number(searchParams.get('page') || 1) || 1);

  const [draftSort, setDraftSort] = useState<SortValue>(urlSort);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [maxPrice, setMaxPrice] = useState(DEFAULT_MAX_PRICE);
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterStars, setFilterStars] = useState<number[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>(
    urlCategory ? [urlCategory] : [],
  );

  useEffect(() => {
    setDraftSort(urlSort);
    setFilterCategories(urlCategory ? [urlCategory] : []);
  }, [urlSort, urlCategory]);

  useEffect(() => {
    if (desktop) setFiltersOpen(false);
  }, [desktop]);

  useEffect(() => {
    if (!filtersOpen || desktop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen, desktop]);

  useEffect(() => {
    if (!filtersOpen || desktop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtersOpen, desktop]);

  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

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
  });

  const listings = data?.listings ?? [];
  const total = data?.total ?? 0;
  const limit = queryParams.limit ?? 12;
  const hasMore = urlPage * limit < total;
  const hasPrev = urlPage > 1;

  const amenityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of listings) {
      for (const a of item.amenities ?? []) {
        counts[a] = (counts[a] ?? 0) + 1;
      }
    }
    return counts;
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (filterVerified && !item.isVerified) return false;
      const minP = getMinPrice(item);
      if (minP > maxPrice) return false;
      if (filterStars.length > 0) {
        const bucket = Math.round(item.averageRating ?? 0);
        if (!filterStars.includes(bucket)) return false;
      }
      if (filterCategories.length > 0 && item.category?.slug) {
        if (!filterCategories.includes(item.category.slug)) return false;
      }
      return true;
    });
  }, [listings, filterVerified, maxPrice, filterStars, filterCategories]);

  const verifiedCount = listings.filter((l) => l.isVerified).length;

  const activeFilterCount = countActiveFilters(
    maxPrice,
    filterVerified,
    filterStars,
    filterCategories,
    urlCategory,
  );

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

  function toggleStar(star: number): void {
    setFilterStars((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star],
    );
  }

  function toggleCategory(slug: string): void {
    setFilterCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function clearAllFilters(): void {
    setMaxPrice(DEFAULT_MAX_PRICE);
    setFilterVerified(false);
    setFilterStars([]);
    setFilterCategories(urlCategory ? [urlCategory] : []);
  }

  const filtersPanelProps = {
    t,
    tCommon,
    currentLang,
    categories,
    amenityCounts,
    verifiedCount,
    maxPrice,
    onMaxPriceChange: setMaxPrice,
    filterVerified,
    onFilterVerifiedChange: setFilterVerified,
    filterStars,
    onToggleStar: toggleStar,
    filterCategories,
    onToggleCategory: toggleCategory,
  };

  const sortControl = (
    <SelectField
      className={styles.sortWrap}
      size="pill"
      aria-label={t('sortBy')}
      value={draftSort}
      onChange={(next) => {
        const v = readSort(next);
        setDraftSort(v);
        applySort(v);
      }}
      options={[
        { value: '', label: t('sortRecommended') },
        { value: 'relevance', label: t('sortRelevance') },
        { value: 'rating', label: t('sortRating') },
        { value: 'newest', label: t('sortNewest') },
        { value: 'price_low', label: t('sortPriceLow') },
        { value: 'price_high', label: t('sortPriceHigh') },
      ]}
    />
  );

  const viewToggle = (
    <div className={styles.viewToggle}>
      <button
        type="button"
        className={`${styles.viewBtn} ${view === 'list' ? styles.viewActive : ''}`}
        onClick={() => setView('list')}
      >
        {t('listView')}
      </button>
      <button
        type="button"
        className={`${styles.viewBtn} ${view === 'grid' ? styles.viewActive : ''}`}
        onClick={() => setView('grid')}
      >
        {tCommon('gridView')}
      </button>
    </div>
  );

  return (
    <>
      <ListingsSearchStrip />
      <div className={styles.layout} data-testid="search-page">
        {desktop ? (
          <aside className={styles.sidebar} aria-label={t('filterBy')}>
            <SearchFiltersPanel {...filtersPanelProps} />
          </aside>
        ) : null}

        <section className={styles.results}>
          <div className={styles.resultsHeader}>
            <h1 className={styles.resultsTitle}>{t('showingResults', { count: total })}</h1>

            {!desktop ? (
              <div className={styles.mobileToolbar}>
                <button
                  type="button"
                  className={styles.filtersBtn}
                  aria-expanded={filtersOpen}
                  onClick={() => setFiltersOpen(true)}
                  data-testid="search-filters-toggle"
                >
                  <SlidersHorizontal size={18} strokeWidth={2} aria-hidden />
                  <span>{t('filters')}</span>
                  {activeFilterCount > 0 ? (
                    <span className={styles.filtersBadge} aria-label={String(activeFilterCount)}>
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>
                {sortControl}
                {viewToggle}
              </div>
            ) : (
              <div className={styles.toolbar}>
                {sortControl}
                {viewToggle}
              </div>
            )}
          </div>

          {isError ? (
            <div className={styles.error} role="alert">
              <p>{getApiErrorMessage(error, tErrors)}</p>
              <button type="button" className="btnSecondary" onClick={() => void refetch()}>
                {tCommon('retry')}
              </button>
            </div>
          ) : null}

          {isLoading ? (
            <div className={view === 'grid' ? styles.grid : styles.list}>
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCard key={i} skeleton variant={view === 'grid' ? 'grid' : 'list'} />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>{t('noResultsTitle')}</p>
              <p className={styles.emptyDesc}>{t('noResultsDesc')}</p>
            </div>
          ) : (
            <div
              className={view === 'grid' ? styles.grid : styles.list}
              data-testid="search-results"
            >
              {filteredListings.map((item) => (
                <ListingCard
                  key={item._id}
                  listing={mapListingToCard(item)}
                  variant={view === 'grid' ? 'grid' : 'list'}
                  showDealPrice={item.isFeatured}
                />
              ))}
            </div>
          )}

          {!isLoading && filteredListings.length > 0 && (hasPrev || hasMore) ? (
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

      {!desktop && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                className={`${styles.filterSheetBackdrop} ${filtersOpen ? styles.filterSheetBackdropVisible : ''}`}
                aria-hidden={!filtersOpen}
                tabIndex={filtersOpen ? 0 : -1}
                onClick={closeFilters}
                aria-label={tCommon('close')}
                data-testid="search-filters-backdrop"
              />
              <div
                className={`${styles.filterSheet} ${filtersOpen ? styles.filterSheetOpen : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label={t('filterBy')}
                aria-hidden={!filtersOpen}
                data-testid="search-filters-sheet"
              >
                <div className={styles.filterSheetHeader}>
                  <h2 className={styles.filterSheetTitle}>{t('filters')}</h2>
                  <button
                    type="button"
                    className={styles.filterSheetClose}
                    onClick={closeFilters}
                    aria-label={tCommon('close')}
                  >
                    ×
                  </button>
                </div>
                <div className={styles.filterSheetBody}>
                  <SearchFiltersPanel {...filtersPanelProps} compact />
                </div>
                <div className={styles.filterSheetFooter}>
                  <button
                    type="button"
                    className={`btnSecondary ${styles.filterSheetAction}`}
                    onClick={clearAllFilters}
                    disabled={activeFilterCount === 0}
                  >
                    {t('clearFilters')}
                  </button>
                  <button
                    type="button"
                    className={`btnPrimary ${styles.filterSheetAction}`}
                    onClick={closeFilters}
                  >
                    {t('applyFilters')}
                  </button>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
