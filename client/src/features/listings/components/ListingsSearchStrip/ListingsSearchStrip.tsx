import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import { SearchBar } from '../../../../components/shared/SearchBar';
import { fetchCategories } from '../../api/listingsApi';
import styles from './ListingsSearchStrip.module.css';

export function ListingsSearchStrip() {
  const { t } = useTranslation('listings');
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const urlCategory = searchParams.get('category') ?? '';
  const parts = urlSearch.trim().split(/\s+/);
  const city = parts[0] ?? '';
  const keyword = parts.slice(1).join(' ');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  return (
    <div className={styles.strip} data-testid="listings-search-strip">
      <div className={styles.inner}>
        <nav className={styles.breadcrumb} aria-label={t('breadcrumbHome')}>
          <Link to="/">{t('breadcrumbHome')}</Link>
          <span aria-hidden> / </span>
          <span>{t('searchTitle')}</span>
        </nav>
        <SearchBar
          variant="compact"
          categories={categories}
          initialCategory={urlCategory}
          initialCity={city}
          initialKeyword={keyword}
          className={styles.bar}
        />
      </div>
    </div>
  );
}
