import { getLocalizedValue } from '@growth-world/shared';
import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createSearchParams, useNavigate } from 'react-router-dom';

import { SelectField } from '../SelectField';
import { useLanguage } from '../../../hooks/useLanguage';
import type { CategoryDto } from '../../../features/listings/api/listingsApi';
import styles from './SearchBar.module.css';

export type SearchBarProps = {
  variant?: 'hero' | 'compact';
  categories?: CategoryDto[];
  initialCategory?: string;
  initialCity?: string;
  initialKeyword?: string;
  className?: string;
};

export function SearchBar({
  variant = 'hero',
  categories = [],
  initialCategory = '',
  initialCity = '',
  initialKeyword = '',
  className = '',
}: SearchBarProps) {
  const { t } = useTranslation(['listings', 'common']);
  const { currentLang } = useLanguage();
  const navigate = useNavigate();
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);
  const [keyword, setKeyword] = useState(initialKeyword);

  useEffect(() => {
    setCategory(initialCategory);
    setCity(initialCity);
    setKeyword(initialKeyword);
  }, [initialCategory, initialCity, initialKeyword]);

  function onSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (category) params.category = category;
    const searchParts = [city.trim(), keyword.trim()].filter(Boolean);
    if (searchParts.length) params.search = searchParts.join(' ');
    navigate({
      pathname: '/listings',
      search: createSearchParams(params).toString(),
    });
  }

  return (
    <form
      className={`${styles.bar} ${styles[variant]} ${className}`.trim()}
      onSubmit={onSubmit}
      data-testid="search-bar"
    >
      <div className={styles.segment}>
        <label className={styles.label} htmlFor="gw-search-category">
          {t('listings:searchFieldCategory')}
        </label>
        <SelectField
          id="gw-search-category"
          variant="ghost"
          triggerClassName={styles.input}
          value={category}
          onChange={setCategory}
          placeholder={t('common:allCategories')}
          options={[
            { value: '', label: t('common:allCategories') },
            ...categories.map((c) => ({
              value: c.slug,
              label: getLocalizedValue(c.name, currentLang),
            })),
          ]}
        />
      </div>
      <div className={styles.divider} aria-hidden />
      <div className={styles.segment}>
        <label className={styles.label} htmlFor="gw-search-city">
          {t('listings:searchFieldCity')}
        </label>
        <input
          id="gw-search-city"
          className={styles.input}
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t('common:cityPlaceholder')}
          autoComplete="off"
        />
      </div>
      <div className={styles.divider} aria-hidden />
      <div className={styles.segment}>
        <label className={styles.label} htmlFor="gw-search-keyword">
          {t('listings:searchFieldKeyword')}
        </label>
        <input
          id="gw-search-keyword"
          className={styles.input}
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={t('common:keywordPlaceholder')}
          autoComplete="off"
        />
      </div>
      <button type="submit" className={styles.submit}>
        {t('listings:heroSearchBtn')}
      </button>
    </form>
  );
}
