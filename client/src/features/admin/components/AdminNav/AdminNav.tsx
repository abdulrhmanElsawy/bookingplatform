import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import shell from '../adminShell.module.css';

const NAV_ITEMS = [
  { to: '/admin', end: true, key: 'nav.overview' },
  { to: '/admin/listings', key: 'nav.listings' },
  { to: '/admin/users', key: 'nav.users' },
  { to: '/admin/reviews', key: 'nav.reviews' },
  { to: '/admin/categories', key: 'nav.categories' },
  { to: '/admin/subscriptions', key: 'nav.subscriptions' },
  { to: '/admin/payments', key: 'nav.payments' },
  { to: '/admin/content', key: 'nav.content' },
  { to: '/admin/settings', key: 'nav.settings' },
  { to: '/admin/audit', key: 'nav.audit' },
] as const;

export type AdminNavProps = {
  onNavigate?: () => void;
  showBrand?: boolean;
};

export function AdminNav({ onNavigate, showBrand = true }: AdminNavProps) {
  const { t } = useTranslation('admin');

  return (
    <nav aria-label={t('nav.label')}>
      {showBrand ? (
        <>
          <p className={shell.brand}>{t('title')}</p>
          <p className={shell.brandSub}>{t('nav.brandSubtitle')}</p>
        </>
      ) : null}
      <ul className={shell.navList}>
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                isActive ? `${shell.navLink} ${shell.navLinkActive}` : shell.navLink
              }
              onClick={() => onNavigate?.()}
            >
              {t(item.key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
