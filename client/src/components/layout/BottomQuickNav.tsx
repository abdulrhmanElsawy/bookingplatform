import { BarChart3, Heart, Home, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import styles from './BottomQuickNav.module.css';

const links = [
  { to: '/account/profile', labelKey: 'bottomNavAccount', icon: UserRound, end: false },
  { to: '/account/favorites', labelKey: 'bottomNavFavorites', icon: Heart, end: false },
  { to: '/', labelKey: 'bottomNavHome', icon: Home, end: true },
  { to: '/compare', labelKey: 'bottomNavCompare', icon: BarChart3, end: false },
] as const;

export function BottomQuickNav() {
  const { t } = useTranslation('common');

  return (
    <nav className={styles.nav} aria-label={t('bottomNavLabel')} data-testid="bottom-quick-nav">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          >
            <Icon size={22} strokeWidth={2.1} aria-hidden />
            <span>{t(link.labelKey)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
