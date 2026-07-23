import { BarChart3, Building2, Home, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';

import { useCompareStore } from '../../features/compare/compareStore';
import { useAuthStore } from '../../store/authStore';
import styles from './BottomQuickNav.module.css';

export function BottomQuickNav() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const compareCount = useCompareStore((s) => s.items.length);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === 'gym_owner';

  const accountTo = isAuthenticated ? '/account' : '/login';
  const accountActive =
    location.pathname.startsWith('/account') ||
    (!isAuthenticated && location.pathname === '/login');

  const tabCount = isOwner ? 4 : 3;

  return (
    <nav
      className={styles.nav}
      style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}
      aria-label={t('bottomNavLabel')}
      data-testid="bottom-quick-nav"
    >
      <NavLink
        to="/"
        end
        className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        data-testid="bottom-nav-home"
      >
        <Home size={22} strokeWidth={2.1} aria-hidden />
        <span>{t('bottomNavHome')}</span>
      </NavLink>

      <NavLink
        to="/compare"
        className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        data-testid="bottom-nav-compare"
      >
        <span className={styles.iconWrap}>
          <BarChart3 size={22} strokeWidth={2.1} aria-hidden />
          {compareCount > 0 ? (
            <span className={styles.badge} data-testid="bottom-nav-compare-badge">
              {compareCount}
            </span>
          ) : null}
        </span>
        <span>{t('bottomNavCompare')}</span>
      </NavLink>

      {isOwner ? (
        <NavLink
          to="/owner"
          end
          className={({ isActive }) =>
            `${styles.link} ${isActive || location.pathname.startsWith('/owner/') ? styles.active : ''}`
          }
          data-testid="bottom-nav-your-club"
        >
          <Building2 size={22} strokeWidth={2.1} aria-hidden />
          <span>{t('bottomNavYourClub')}</span>
        </NavLink>
      ) : null}

      <NavLink
        to={accountTo}
        className={() => `${styles.link} ${accountActive ? styles.active : ''}`}
        data-testid="bottom-nav-account"
      >
        <UserRound size={22} strokeWidth={2.1} aria-hidden />
        <span>{t('bottomNavAccount')}</span>
      </NavLink>
    </nav>
  );
}
