import { getLocalizedValue, isCategoryLive } from '@growth-world/shared';
import type { TFunction } from 'i18next';

import { FilterCard } from '../../../../components/shared/FilterCard';
import type { AppLang } from '../../../../hooks/useLanguage';
import type { CategoryDto } from '../../api/listingsApi';
import styles from './SearchPage.module.css';

export type SearchFiltersPanelProps = {
  t: TFunction<'listings'>;
  tCommon: TFunction<'common'>;
  currentLang: AppLang;
  categories: CategoryDto[];
  amenityCounts: Record<string, number>;
  verifiedCount: number;
  maxPrice: number;
  onMaxPriceChange: (value: number) => void;
  filterVerified: boolean;
  onFilterVerifiedChange: (checked: boolean) => void;
  filterStars: number[];
  onToggleStar: (star: number) => void;
  filterCategories: string[];
  onToggleCategory: (slug: string) => void;
  compact?: boolean;
};

export function SearchFiltersPanel({
  t,
  tCommon,
  currentLang,
  categories,
  amenityCounts,
  verifiedCount,
  maxPrice,
  onMaxPriceChange,
  filterVerified,
  onFilterVerifiedChange,
  filterStars,
  onToggleStar,
  filterCategories,
  onToggleCategory,
  compact = false,
}: SearchFiltersPanelProps) {
  return (
    <>
      <FilterCard title={t('mapView')} compact={compact}>
        <div className={styles.mapThumb} aria-hidden>
          <span className={styles.mapLabel}>{t('mapPlaceholder')}</span>
        </div>
        <button type="button" className={styles.mapBtn} disabled aria-disabled>
          {tCommon('showOnMap')}
        </button>
      </FilterCard>

      <FilterCard title={t('priceRange')} compact={compact}>
        <p className={styles.filterNote}>{t('priceFilterNote')}</p>
        <input
          type="range"
          min={0}
          max={5000}
          step={50}
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(Number(e.target.value))}
          className={styles.range}
        />
        <span className={styles.rangeValue}>
          {t('maxPrice')}: {maxPrice}
        </span>
      </FilterCard>

      <FilterCard title={tCommon('popularFilters')} compact={compact}>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={filterVerified}
            onChange={(e) => onFilterVerifiedChange(e.target.checked)}
          />
          <span>{t('verifiedOnly')}</span>
          <span className={styles.count}>{verifiedCount}</span>
        </label>
        {Object.entries(amenityCounts)
          .slice(0, 4)
          .map(([key, count]) => (
            <label key={key} className={styles.checkRow}>
              <input type="checkbox" disabled aria-disabled />
              <span>{t(`amenities.${key}`)}</span>
              <span className={styles.count}>{count}</span>
            </label>
          ))}
      </FilterCard>

      <FilterCard title={tCommon('starRating')} compact={compact}>
        {[5, 4, 3, 2, 1].map((star) => (
          <label key={star} className={styles.checkRow}>
            <input
              type="checkbox"
              checked={filterStars.includes(star)}
              onChange={() => onToggleStar(star)}
            />
            <span>{t('stars', { count: star })}</span>
          </label>
        ))}
      </FilterCard>

      <FilterCard title={t('category')} compact={compact}>
        {categories.map((c) => {
          const live = c.isBookable ?? isCategoryLive(c.slug);
          return (
            <label key={c._id} className={styles.checkRow}>
              <input
                type="checkbox"
                checked={filterCategories.includes(c.slug)}
                onChange={() => onToggleCategory(c.slug)}
                disabled={!live}
                aria-disabled={!live}
              />
              <span>
                {getLocalizedValue(c.name, currentLang)}
                {!live ? ` (${tCommon('categoryComingSoon')})` : ''}
              </span>
            </label>
          );
        })}
      </FilterCard>

      <FilterCard title={t('openNow')} compact={compact}>
        <label className={styles.checkRow}>
          <input type="checkbox" disabled aria-disabled />
          <span>{t('openNow')}</span>
        </label>
      </FilterCard>
    </>
  );
}
