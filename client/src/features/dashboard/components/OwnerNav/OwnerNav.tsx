import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import shell from '../../../admin/components/adminShell.module.css';

const OWNER_ITEMS = [
  { to: '/owner', end: true, ns: 'dashboard' as const, key: 'adsDashboard' },
  { to: '/owner/listings', ns: 'dashboard' as const, key: 'myAds' },
  { to: '/owner/reviews', ns: 'dashboard' as const, key: 'reviewsManagement' },
  { to: '/owner/plans', ns: 'payments' as const, key: 'pricingTitle' },
  { to: '/owner/check-in', ns: 'subscriptions' as const, key: 'checkInTitle' },
] as const;

export type OwnerNavProps = {
  onNavigate?: () => void;
  showBrand?: boolean;
};

export function OwnerNav({ onNavigate, showBrand = true }: OwnerNavProps) {
  const { t: tDash } = useTranslation('dashboard');
  const { t: tPay } = useTranslation('payments');
  const { t: tSub } = useTranslation('subscriptions');

  function label(item: (typeof OWNER_ITEMS)[number]): string {
    if (item.ns === 'dashboard') return tDash(item.key);
    if (item.ns === 'payments') return tPay(item.key);
    return tSub(item.key);
  }

  return (
    <nav aria-label={tDash('adsDashboard')}>
      {showBrand ? (
        <>
          <p className={shell.brand}>{tDash('adsDashboard')}</p>
          <p className={shell.brandSub}>{tDash('ownerDashboardSubtitle')}</p>
        </>
      ) : null}
      <ul className={shell.navList}>
        {OWNER_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                isActive ? `${shell.navLink} ${shell.navLinkActive}` : shell.navLink
              }
              onClick={() => onNavigate?.()}
            >
              {label(item)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
