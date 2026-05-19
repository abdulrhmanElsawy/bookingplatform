import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  Clock3,
  Dumbbell,
  Flame,
  Mars,
  SlidersHorizontal,
  Star,
  Waves,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';

import { ListingCard } from '../../../../components/shared/ListingCard';
import i18n from '../../../../i18n';
import { useSEO } from '../../../../hooks/useSEO';
import { COMPARE_MAX_ITEMS, useCompareStore } from '../../../compare/compareStore';
import {
  fetchListings,
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
  const urlSort = readSort(searchParams.get('sort'));
  const urlPage = Math.max(1, Number(searchParams.get('page') || 1) || 1);

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

  const filteredListings = listings;

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

  const mobileSearchPanel = (
    <div className={styles.mobileSearchPanel}>
      <div className={styles.mobileChipRow}>
        <button type="button" className={styles.mobileChip}>
          <ChevronDown size={15} aria-hidden />
          {t('homeDurationMonth')}
        </button>
        <button type="button" className={styles.mobileChip}>
          <Mars size={16} aria-hidden />
          {t('homeFilterMen')}
        </button>
        <button type="button" className={styles.mobileChip}>
          <Clock3 size={16} aria-hidden />
          {t('homeFilter24h')}
        </button>
        <button type="button" className={styles.mobileChip}>
          <Waves size={16} aria-hidden />
          {t('homeFilterPool')}
        </button>
        <button
          type="button"
          className={styles.mobileChip}
        >
          <SlidersHorizontal size={16} aria-hidden />
          {t('homeFilterMore')}
        </button>
      </div>

      <div className={styles.mobileSortRow}>
        <button type="button" className={styles.mobileChip}>
          <ChevronDown size={15} aria-hidden />
          {t('sortBy')}
        </button>
        <button
          type="button"
          className={styles.mobileChip}
          onClick={() => applySort('distance')}
        >
          {t('sortDistance')}
        </button>
        <button
          type="button"
          className={styles.mobileChip}
          onClick={() => applySort('rating')}
        >
          <Star size={15} aria-hidden />
          {t('homeSortRated')}
        </button>
        <button
          type="button"
          className={`${styles.mobileChip} ${urlSort === 'price_low' ? styles.mobileChipActive : ''}`}
          onClick={() => applySort('price_low')}
        >
          <Dumbbell size={15} aria-hidden />
          {t('homeSortCheapest')}
        </button>
        <button type="button" className={styles.mobileChip}>
          <Flame size={15} aria-hidden />
          {t('homeSortPopular')}
        </button>
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

          {isError ? (
            <div className={styles.error} role="alert">
              <p>{getApiErrorMessage(error, tErrors)}</p>
              <button type="button" className="btnSecondary" onClick={() => void refetch()}>
                {tCommon('retry')}
              </button>
            </div>
          ) : null}

          {isLoading ? (
            <div className={styles.list}>
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCard key={i} skeleton variant="list" />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>{t('noResultsTitle')}</p>
              <p className={styles.emptyDesc}>{t('noResultsDesc')}</p>
            </div>
          ) : (
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

    </>
  );
}
