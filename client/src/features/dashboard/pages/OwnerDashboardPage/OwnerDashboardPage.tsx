import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Building2,
  Eye,
  LayoutGrid,
  MessageSquare,
  MousePointerClick,
  PlusCircle,
  Star,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLanguage } from '../../../../hooks/useLanguage';
import {
  formatDashboardInteger,
  formatDashboardRating,
} from '../../../../utils/formatDashboardNumber';
import { fetchOwnerOverview } from '../../api/dashboardApi';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import styles from './OwnerDashboardPage.module.css';

function barPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
}

type QuickAction = {
  to: string;
  label: string;
  icon: LucideIcon;
  testId: string;
  primary?: boolean;
};

export function OwnerDashboardPage() {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const { t: tPay } = useTranslation('payments');
  const { t: tSub } = useTranslation('subscriptions');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const isEn = currentLang === 'en';
  const lang = isEn ? 'en' : 'ar';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['owner-dashboard-overview'],
    queryFn: fetchOwnerOverview,
  });

  const maxBar = data
    ? Math.max(data.totalViews, data.totalContactClicks * 8, data.activeListings * 40, 1)
    : 1;

  const quickActions: QuickAction[] = [
    {
      to: '/owner/listings',
      label: t('myListings'),
      icon: LayoutGrid,
      testId: 'my-listings-link',
    },
    {
      to: '/owner/listings/new',
      label: t('addListing'),
      icon: PlusCircle,
      testId: 'add-listing-link',
      primary: true,
    },
    {
      to: '/owner/reviews',
      label: t('reviewsManagement'),
      icon: MessageSquare,
      testId: 'owner-reviews-link',
    },
    {
      to: '/owner/plans',
      label: tPay('pricingTitle'),
      icon: BarChart3,
      testId: 'owner-plans-link',
    },
    {
      to: '/owner/check-in',
      label: tSub('checkInTitle'),
      icon: Ticket,
      testId: 'owner-check-in-link',
    },
  ];

  return (
    <div className={styles.page} data-testid="owner-dashboard-page">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t('dashboardTitle')}</h1>
          <p className={styles.sub}>
            {t('ownerDashboardSubtitle', {
              defaultValue: isEn
                ? 'Track performance, manage venues, and grow your presence on Growth World.'
                : 'تابع الأداء، وأدر منشآتك، ونمِّ حضورك على Growth World.',
            })}
          </p>
        </header>

        <nav className={styles.quickActions} aria-label={t('overview')}>
          {quickActions.map(({ to, label, icon: Icon, testId, primary }) => (
            <Link
              key={to}
              to={to}
              className={`${styles.actionCard} ${primary ? styles.actionCardPrimary : ''}`}
              data-testid={testId}
            >
              <span className={styles.actionIcon} aria-hidden>
                <Icon size={20} strokeWidth={2} />
              </span>
              <span className={styles.actionLabel}>{label}</span>
            </Link>
          ))}
        </nav>

        {isLoading ? (
          <p className={styles.loadingWrap}>{tCommon('loading')}</p>
        ) : null}

        {isError ? (
          <p className={styles.error} role="alert">
            {getApiErrorMessage(error, tErrors)}
          </p>
        ) : null}

        {!isLoading && !isError && data ? (
          <>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('overview')}</h2>
            </div>

            <div className={styles.statsGrid}>
              <article className={styles.statCard}>
                <span className={styles.statIcon} aria-hidden>
                  <Eye size={18} strokeWidth={2} />
                </span>
                <h3 className={styles.statLabel}>{t('totalViews')}</h3>
                <p className={styles.statValue} data-testid="dash-total-views">
                  {formatDashboardInteger(data.totalViews, lang)}
                </p>
                {data.viewsChangePercent !== null ? (
                  <p
                    className={`${styles.statMeta} ${
                      data.viewsChangePercent >= 0 ? styles.statMetaUp : styles.statMetaDown
                    }`}
                  >
                    {t('viewsThisMonth')}: {formatDashboardInteger(data.viewsThisMonth, lang)} ·{' '}
                    {data.viewsChangePercent >= 0
                      ? t('increase', { percent: data.viewsChangePercent })
                      : t('decrease', { percent: Math.abs(data.viewsChangePercent) })}
                  </p>
                ) : (
                  <p className={styles.statMeta}>{t('viewsThisMonth')}</p>
                )}
              </article>

              <article className={styles.statCard}>
                <span className={styles.statIcon} aria-hidden>
                  <MousePointerClick size={18} strokeWidth={2} />
                </span>
                <h3 className={styles.statLabel}>{t('contactClicks')}</h3>
                <p className={styles.statValue} data-testid="dash-contact-clicks">
                  {formatDashboardInteger(data.totalContactClicks, lang)}
                </p>
              </article>

              <article className={styles.statCard}>
                <span className={styles.statIcon} aria-hidden>
                  <Building2 size={18} strokeWidth={2} />
                </span>
                <h3 className={styles.statLabel}>{t('activeListings')}</h3>
                <p className={styles.statValue} data-testid="dash-active-listings">
                  {formatDashboardInteger(data.activeListings, lang)}
                </p>
                <p className={styles.statMeta}>
                  {t('statTotalListings')}: {formatDashboardInteger(data.totalListings, lang)}
                </p>
              </article>

              <article className={styles.statCard}>
                <span className={styles.statIcon} aria-hidden>
                  <MessageSquare size={18} strokeWidth={2} />
                </span>
                <h3 className={styles.statLabel}>{t('pendingReviews')}</h3>
                <p className={styles.statValue} data-testid="dash-pending-reviews">
                  {formatDashboardInteger(data.pendingReviews, lang)}
                </p>
              </article>

              <article className={styles.statCard}>
                <span className={styles.statIcon} aria-hidden>
                  <Star size={18} strokeWidth={2} />
                </span>
                <h3 className={styles.statLabel}>{t('avgRating')}</h3>
                <p className={styles.statValue} data-testid="dash-avg-rating">
                  {formatDashboardRating(data.avgRating, lang)}
                </p>
              </article>
            </div>

            <section className={styles.chartCard} aria-label={t('chartViewsHint')}>
              <h2 className={styles.chartTitle}>{t('analytics')}</h2>
              <p className={styles.chartHint}>{t('chartViewsHint')}</p>
              <div className={styles.bars}>
                <div className={styles.barRow}>
                  <span className={styles.barLabel}>{t('totalViews')}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${barPercent(data.totalViews, maxBar)}%` }}
                    />
                  </div>
                  <span className={styles.barValue}>
                    {formatDashboardInteger(data.totalViews, lang)}
                  </span>
                </div>
                <div className={styles.barRow}>
                  <span className={styles.barLabel}>{t('contactClicks')}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${barPercent(data.totalContactClicks * 8, maxBar)}%`,
                      }}
                    />
                  </div>
                  <span className={styles.barValue}>
                    {formatDashboardInteger(data.totalContactClicks, lang)}
                  </span>
                </div>
                <div className={styles.barRow}>
                  <span className={styles.barLabel}>{t('activeListings')}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${barPercent(data.activeListings * 40, maxBar)}%` }}
                    />
                  </div>
                  <span className={styles.barValue}>
                    {formatDashboardInteger(data.activeListings, lang)}
                  </span>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
