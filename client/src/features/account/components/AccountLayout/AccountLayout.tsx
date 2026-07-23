import { Menu } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import shell from '../../../admin/components/adminShell.module.css';
import { AccountNav } from '../AccountNav/AccountNav';

const DESKTOP_QUERY = '(min-width: 960px)';

const SECTION_BY_PATH: Record<string, string> = {
  '/account': 'accountHubTitle',
  '/account/profile': 'accountNavProfile',
  '/account/favorites': 'accountNavFavorites',
  '/account/memberships': 'accountNavMemberships',
  '/account/notifications': 'accountNavNotifications',
};

function useDesktopHub(): boolean {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_QUERY).matches : true,
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setDesktop(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return desktop;
}

export function AccountLayout() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const desktop = useDesktopHub();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerId = useId();
  const drawerTitleId = useId();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen || desktop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen, desktop]);

  useEffect(() => {
    if (!menuOpen || desktop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, desktop, closeMenu]);

  if (location.pathname === '/account' || location.pathname === '/account/') {
    return <Navigate to="/account/profile" replace />;
  }

  const sectionKey = SECTION_BY_PATH[location.pathname] ?? 'accountHubTitle';
  const sectionTitle = t(sectionKey);

  return (
    <div className={shell.shell} data-testid="account-layout">
      <div className={shell.inner}>
        {!desktop ? (
          <div className={shell.mobileBar}>
            <button
              type="button"
              className={shell.menuBtn}
              aria-expanded={menuOpen}
              aria-controls={drawerId}
              onClick={() => setMenuOpen((open) => !open)}
              data-testid="account-menu-toggle"
            >
              <Menu size={22} strokeWidth={2} aria-hidden />
              <span className={shell.menuBtnLabel}>{t('openMenu')}</span>
            </button>
            <p className={shell.mobileSection}>{sectionTitle}</p>
          </div>
        ) : (
          <aside className={shell.sidebar}>
            <AccountNav />
          </aside>
        )}

        <main className={shell.main}>
          <Outlet />
        </main>
      </div>

      {!desktop && menuOpen && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                className={shell.drawerBackdrop}
                aria-label={t('close')}
                onClick={closeMenu}
                data-testid="account-drawer-backdrop"
              />
              <aside
                id={drawerId}
                className={`${shell.drawer} ${shell.drawerOpen}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={drawerTitleId}
                data-testid="account-mobile-drawer"
              >
                <div className={shell.drawerHeader}>
                  <span id={drawerTitleId} className={shell.drawerTitle}>
                    {t('accountHubTitle')}
                  </span>
                  <button
                    type="button"
                    className={shell.drawerClose}
                    onClick={closeMenu}
                    aria-label={t('close')}
                    data-testid="account-drawer-close"
                  >
                    ×
                  </button>
                </div>
                <div className={shell.drawerBody}>
                  <AccountNav onNavigate={closeMenu} showBrand={false} />
                </div>
              </aside>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
