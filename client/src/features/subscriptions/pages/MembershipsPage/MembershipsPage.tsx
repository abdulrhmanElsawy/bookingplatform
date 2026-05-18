import { getLocalizedValue } from '@growth-world/shared';
import { useQuery } from '@tanstack/react-query';
import { Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLanguage } from '../../../../hooks/useLanguage';
import { useSubscriptionT, type SubscriptionKey } from '../../i18n/useSubscriptionT';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { fetchMySubscriptions } from '../../api/subscriptionsApi';
import styles from '../subscriptionPages.module.css';
import favStyles from '../../../favorites/pages/FavoritesPage/FavoritesPage.module.css';

function statusLabel(
  status: string,
  t: (key: SubscriptionKey) => string,
): { text: string; className: string } {
  if (status === 'active') {
    return { text: t('statusActive'), className: styles.statusActive };
  }
  if (status === 'expired') {
    return { text: t('statusExpired'), className: styles.statusExpired };
  }
  return { text: t('statusCancelled'), className: styles.statusExpired };
}

export function MembershipsPage() {
  const { t } = useSubscriptionT();
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-subscriptions', 1],
    queryFn: () => fetchMySubscriptions(1, 48),
  });

  const subs = data?.subscriptions ?? [];

  return (
    <div className={favStyles.page} data-testid="memberships-page">
      <div className={`${favStyles.container} ${styles.containerWide}`}>
        <Link className={favStyles.backLink} to="/account/profile">
          ← {t('backToProfile')}
        </Link>
        <header className={favStyles.header}>
          <h1 className={favStyles.title}>{t('membershipsTitle')}</h1>
          <p className={favStyles.subtitle}>{t('membershipsSubtitle')}</p>
        </header>

        {isLoading ? (
          <div className={favStyles.loadingWrap}>{tCommon('loading')}</div>
        ) : null}
        {isError ? (
          <p className={favStyles.error} role="alert">
            {getApiErrorMessage(error, tErrors)}
          </p>
        ) : null}

        {!isLoading && !isError && subs.length === 0 ? (
          <div className={favStyles.empty}>
            <span className={favStyles.emptyIcon} aria-hidden>
              <Ticket size={28} strokeWidth={1.75} />
            </span>
            <p className={favStyles.emptyTitle}>{t('membershipsEmpty')}</p>
            <p className={favStyles.emptySub}>{t('membershipsEmptySub')}</p>
            <Link className={favStyles.browseBtn} to="/listings">
              {t('browseVenues')}
            </Link>
          </div>
        ) : null}

        {!isLoading && !isError && subs.length > 0 ? (
          <div className={styles.membershipGrid}>
            {subs.map((sub) => {
              const badge = statusLabel(sub.status, t);
              const until = new Date(sub.validUntil).toLocaleDateString(
                currentLang === 'en' ? 'en-SA' : 'ar-SA',
              );
              return (
                <article key={sub.id} className={styles.membershipCard}>
                  <Link to={`/listings/${sub.listing.slug}`}>
                    <strong>{getLocalizedValue(sub.listing.name, currentLang)}</strong>
                  </Link>
                  <p className={favStyles.subtitle}>
                    {getLocalizedValue(sub.packageSnapshot.name, currentLang)}
                  </p>
                  <p className={styles.membershipCode}>{sub.accessCode}</p>
                  <p className={favStyles.subtitle}>
                    {t('validUntil')}: {until}
                  </p>
                  <span className={`${styles.statusBadge} ${badge.className}`}>
                    {badge.text}
                  </span>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
