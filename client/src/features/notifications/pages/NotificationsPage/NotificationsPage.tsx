import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLanguage } from '../../../../hooks/useLanguage';
import {
  deleteNotificationApi,
  fetchNotifications,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from '../../api/notificationsApi';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import styles from './NotificationsPage.module.css';

function formatNotifDate(iso: string, lang: 'ar' | 'en'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const locale = lang === 'en' ? 'en-SA' : 'ar-SA';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    numberingSystem: lang === 'ar' ? 'arab' : 'latn',
  }).format(d);
}

export function NotificationsPage() {
  const { t } = useTranslation('notifications');
  const { t: tProfile } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const isEn = currentLang === 'en';
  const lang = isEn ? 'en' : 'ar';
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['notifications', 1],
    queryFn: () => fetchNotifications(1, 40),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotificationApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const unread = listQuery.data?.unreadCount ?? 0;
  const total = listQuery.data?.total ?? 0;
  const hasItems = Boolean(listQuery.data?.notifications.length);

  return (
    <div className={styles.page} data-testid="notifications-page">
      <div className={styles.container}>
        <Link className={styles.backLink} to="/account/profile">
          ←{' '}
          {tProfile('backToProfile', {
            defaultValue: isEn ? 'Back to profile' : 'العودة إلى الملف الشخصي',
          })}
        </Link>

        <header className={styles.header}>
          <div className={styles.headerText}>
            <h1 className={styles.title}>{t('notificationsTitle')}</h1>
            <p className={styles.subtitle}>
              {t('notificationsSubtitle', {
                defaultValue: isEn
                  ? 'Stay updated on bookings, reviews, and platform news.'
                  : 'تابع الحجوزات والتقييمات وأخبار المنصة.',
              })}
            </p>
            {!listQuery.isLoading && !listQuery.isError && unread > 0 ? (
              <span className={styles.countBadge}>
                {t('unreadNavLabel', {
                  count: unread,
                  defaultValue: isEn ? '{{count}} unread' : '{{count}} غير مقروء',
                })}
              </span>
            ) : null}
            {!listQuery.isLoading && !listQuery.isError && total > 0 && unread === 0 ? (
              <span className={styles.countBadge}>
                {t('notificationsAllRead', {
                  defaultValue: isEn ? 'All caught up' : 'لا جديد',
                })}
              </span>
            ) : null}
          </div>
          {hasItems ? (
            <button
              type="button"
              className={`btnPrimary ${styles.markAllBtn}`}
              disabled={unread === 0 || markAllMutation.isPending || listQuery.isLoading}
              onClick={() => markAllMutation.mutate()}
              data-testid="mark-all-read"
            >
              {t('markAllRead')}
            </button>
          ) : null}
        </header>

        {listQuery.isLoading ? (
          <p className={styles.loadingWrap}>{tCommon('loading')}</p>
        ) : null}

        {listQuery.isError ? (
          <p className={styles.error} role="alert">
            {getApiErrorMessage(listQuery.error, tErrors)}
          </p>
        ) : null}

        {!listQuery.isLoading &&
        !listQuery.isError &&
        listQuery.data &&
        listQuery.data.notifications.length === 0 ? (
          <div className={styles.empty} data-testid="notifications-empty">
            <span className={styles.emptyIcon} aria-hidden>
              <Bell size={24} strokeWidth={2} />
            </span>
            <p className={styles.emptyTitle}>{t('noNotifications')}</p>
            <p className={styles.emptySub}>
              {t('notificationsEmptySub', {
                defaultValue: isEn
                  ? 'When something happens on your account, you will see it here.'
                  : 'عند حدوث أي نشاط على حسابك، سيظهر هنا.',
              })}
            </p>
          </div>
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && listQuery.data ? (
          <div className={styles.list}>
            {listQuery.data.notifications.map((n) => {
              const title = n.title[currentLang];
              const body = n.body[currentLang];
              return (
                <article
                  key={n.id}
                  className={n.read ? styles.cardRead : styles.card}
                  data-testid={`notification-${n.id}`}
                  data-read={n.read ? 'true' : 'false'}
                >
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>{title}</h2>
                    {!n.read ? <span className={styles.unreadDot} aria-hidden /> : null}
                  </div>
                  <p className={styles.cardBody}>{body}</p>
                  <p className={styles.meta}>
                    {!n.read ? <span className={styles.unreadLabel}>{t('unread')}</span> : null}
                    <span>{formatNotifDate(n.createdAt, lang)}</span>
                  </p>
                  <div className={styles.actions}>
                    {!n.read ? (
                      <button
                        type="button"
                        className={styles.btnGhost}
                        disabled={markOneMutation.isPending}
                        onClick={() => markOneMutation.mutate(n.id)}
                      >
                        {t('markAsRead')}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={`${styles.btnGhost} ${styles.btnGhostDanger}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(n.id)}
                    >
                      {t('deleteNotification')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
