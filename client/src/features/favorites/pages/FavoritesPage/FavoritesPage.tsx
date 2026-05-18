import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ListingCard } from '../../../../components/shared/ListingCard';
import { useLanguage } from '../../../../hooks/useLanguage';
import { fetchFavorites } from '../../api/favoritesApi';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { mapListingToCard } from '../../../listings/utils/mapListingToCard';
import styles from './FavoritesPage.module.css';

export function FavoritesPage() {
  const { t } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const isEn = currentLang === 'en';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['favorites', 1],
    queryFn: () => fetchFavorites(1, 48),
  });

  const total = data?.total ?? 0;

  return (
    <div className={styles.page} data-testid="favorites-page">
      <div className={styles.container}>
        <Link className={styles.backLink} to="/account/profile">
          ←{' '}
          {t('backToProfile', {
            defaultValue: isEn ? 'Back to profile' : 'العودة إلى الملف الشخصي',
          })}
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>{t('favoritesTitle')}</h1>
          <p className={styles.subtitle}>
            {t('favoritesSubtitle', {
              defaultValue: isEn
                ? 'Venues you saved for quick access and future booking.'
                : 'المنشآت التي حفظتها للوصول السريع والحجز لاحقاً.',
            })}
          </p>
          {!isLoading && !isError && total > 0 ? (
            <span className={styles.countBadge}>
              {t('favoritesCount', {
                count: total,
                defaultValue: isEn ? '{{count}} saved' : '{{count}} محفوظة',
              })}
            </span>
          ) : null}
        </header>

        {isLoading ? (
          <p className={styles.loadingWrap}>{tCommon('loading')}</p>
        ) : null}

        {isError ? (
          <p className={styles.error} role="alert">
            {getApiErrorMessage(error, tErrors)}
          </p>
        ) : null}

        {!isLoading && !isError && total === 0 ? (
          <div className={styles.empty} data-testid="favorites-empty">
            <span className={styles.emptyIcon} aria-hidden>
              <Heart size={24} strokeWidth={2} />
            </span>
            <p className={styles.emptyTitle}>{t('noFavorites')}</p>
            <p className={styles.emptySub}>
              {t('favoritesEmptySub', {
                defaultValue: isEn
                  ? 'Explore gyms and sports venues, then tap the heart icon to save them here.'
                  : 'استكشف الأندية والمنشآت الرياضية، ثم اضغط أيقونة القلب لحفظها هنا.',
              })}
            </p>
            <Link className={styles.browseBtn} to="/listings">
              {t('favoritesBrowseCta', {
                defaultValue: isEn ? 'Browse venues' : 'تصفح المنشآت',
              })}
            </Link>
          </div>
        ) : null}

        {!isLoading && !isError && data && data.favorites.length > 0 ? (
          <div className={styles.gridCard}>
            <div className={styles.grid}>
              {data.favorites.map((row) =>
                row.listing ? (
                  <ListingCard key={row._id} listing={mapListingToCard(row.listing)} />
                ) : null,
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
