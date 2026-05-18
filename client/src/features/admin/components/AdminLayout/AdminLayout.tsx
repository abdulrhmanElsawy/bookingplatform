import { Menu } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';

import { AdminNav } from '../AdminNav/AdminNav';
import shell from '../adminShell.module.css';

const DESKTOP_QUERY = '(min-width: 960px)';

const SECTION_BY_PATH: Record<string, string> = {
  '/admin': 'nav.overview',
  '/admin/listings': 'nav.listings',
  '/admin/users': 'nav.users',
  '/admin/reviews': 'nav.reviews',
  '/admin/categories': 'nav.categories',
  '/admin/subscriptions': 'nav.subscriptions',
  '/admin/payments': 'nav.payments',
  '/admin/content': 'nav.content',
  '/admin/settings': 'nav.settings',
  '/admin/audit': 'nav.audit',
};

function useDesktopAdmin(): boolean {
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

function sectionKey(pathname: string): string {
  return SECTION_BY_PATH[pathname] ?? 'title';
}

export function AdminLayout() {
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const location = useLocation();
  const desktop = useDesktopAdmin();
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

  const pathKey = sectionKey(location.pathname);
  const sectionTitle = pathKey === 'title' ? t('title') : t(pathKey);

  return (
    <div className={shell.shell} data-testid="admin-layout">
      <div className={shell.inner}>
        {!desktop ? (
          <div className={shell.mobileBar}>
            <button
              type="button"
              className={shell.menuBtn}
              aria-expanded={menuOpen}
              aria-controls={drawerId}
              onClick={() => setMenuOpen((open) => !open)}
              data-testid="admin-menu-toggle"
            >
              <Menu size={22} strokeWidth={2} aria-hidden />
              <span className={shell.menuBtnLabel}>{t('nav.openMenu')}</span>
            </button>
            <p className={shell.mobileSection}>{sectionTitle}</p>
          </div>
        ) : (
          <aside className={shell.sidebar}>
            <AdminNav />
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
                aria-label={tCommon('close')}
                onClick={closeMenu}
                data-testid="admin-drawer-backdrop"
              />
              <aside
                id={drawerId}
                className={`${shell.drawer} ${shell.drawerOpen}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={drawerTitleId}
                data-testid="admin-mobile-drawer"
              >
                <div className={shell.drawerHeader}>
                  <span id={drawerTitleId} className={shell.drawerTitle}>
                    {t('title')}
                  </span>
                  <button
                    type="button"
                    className={shell.drawerClose}
                    onClick={closeMenu}
                    aria-label={tCommon('close')}
                    data-testid="admin-drawer-close"
                  >
                    ×
                  </button>
                </div>
                <div className={shell.drawerBody}>
                  <AdminNav onNavigate={closeMenu} showBrand={false} />
                </div>
              </aside>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
