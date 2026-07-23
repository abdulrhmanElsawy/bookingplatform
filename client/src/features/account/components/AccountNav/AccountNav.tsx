import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '../../../../store/authStore';
import shell from '../../../admin/components/adminShell.module.css';

const ACCOUNT_ITEMS = [
  { to: '/account/profile', end: false, labelKey: 'accountNavProfile', ns: 'profile' as const, key: 'profileTitle' },
  { to: '/account/favorites', end: false, labelKey: 'accountNavFavorites', ns: 'profile' as const, key: 'favoritesTitle' },
  { to: '/account/memberships', end: false, labelKey: 'accountNavMemberships', ns: 'subscriptions' as const, key: 'membershipsTitle' },
  { to: '/account/notifications', end: false, labelKey: 'accountNavNotifications', ns: 'notifications' as const, key: 'notificationsTitle' },
] as const;

const CLUB_ITEMS = [
  { to: '/owner', end: true, ns: 'dashboard' as const, key: 'adsDashboard' },
  { to: '/owner/listings', ns: 'dashboard' as const, key: 'myAds' },
  { to: '/owner/reviews', ns: 'dashboard' as const, key: 'reviewsManagement' },
  { to: '/owner/plans', ns: 'payments' as const, key: 'pricingTitle' },
  { to: '/owner/check-in', ns: 'subscriptions' as const, key: 'checkInTitle' },
] as const;

export type AccountNavProps = {
  onNavigate?: () => void;
  showBrand?: boolean;
};

export function AccountNav({ onNavigate, showBrand = true }: AccountNavProps) {
  const { t } = useTranslation('common');
  const { t: tProfile } = useTranslation('profile');
  const { t: tSub } = useTranslation('subscriptions');
  const { t: tNotif } = useTranslation('notifications');
  const { t: tDash } = useTranslation('dashboard');
  const { t: tPay } = useTranslation('payments');
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === 'gym_owner';

  function accountLabel(item: (typeof ACCOUNT_ITEMS)[number]): string {
    if (item.ns === 'profile' && item.key === 'profileTitle') return tProfile(item.key);
    if (item.ns === 'profile' && item.key === 'favoritesTitle') return tProfile(item.key);
    if (item.ns === 'subscriptions') return tSub(item.key);
    return tNotif(item.key);
  }

  function clubLabel(item: (typeof CLUB_ITEMS)[number]): string {
    if (item.ns === 'dashboard') return tDash(item.key);
    if (item.ns === 'payments') return tPay(item.key);
    return tSub(item.key);
  }

  return (
    <nav aria-label={t('accountHubTitle')}>
      {showBrand ? (
        <>
          <p className={shell.brand}>{t('accountHubTitle')}</p>
          <p className={shell.brandSub}>{t('accountHubSubtitle')}</p>
        </>
      ) : null}

      <p className={shell.navSection}>{t('accountSectionAccount')}</p>
      <ul className={shell.navList}>
        {ACCOUNT_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                isActive ? `${shell.navLink} ${shell.navLinkActive}` : shell.navLink
              }
              onClick={() => onNavigate?.()}
            >
              {accountLabel(item)}
            </NavLink>
          </li>
        ))}
      </ul>

      {isOwner ? (
        <>
          <p className={shell.navSection}>{t('accountSectionClub')}</p>
          <ul className={shell.navList}>
            {CLUB_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) =>
                    isActive ? `${shell.navLink} ${shell.navLinkActive}` : shell.navLink
                  }
                  onClick={() => onNavigate?.()}
                >
                  {clubLabel(item)}
                </NavLink>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </nav>
  );
}
