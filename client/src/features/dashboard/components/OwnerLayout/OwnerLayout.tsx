import { Menu } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';

import shell from '../../../admin/components/adminShell.module.css';
import { OwnerNav } from '../OwnerNav/OwnerNav';

const DESKTOP_QUERY = '(min-width: 960px)';

const SECTION_BY_PATH: Record<string, string> = {
  '/owner': 'adsDashboard',
  '/owner/listings': 'myAds',
  '/owner/listings/new': 'addListing',
  '/owner/reviews': 'reviewsManagement',
  '/owner/plans': 'pricingTitle',
  '/owner/check-in': 'checkInTitle',
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

function sectionTitleKey(pathname: string): string {
  if (SECTION_BY_PATH[pathname]) return SECTION_BY_PATH[pathname];
  if (/^\/owner\/listings\/[^/]+\/edit$/.test(pathname)) return 'editListing';
  if (/^\/owner\/plans\/[^/]+\/checkout$/.test(pathname)) return 'pricingTitle';
  return 'adsDashboard';
}

export function OwnerLayout() {
  const { t: tCommon } = useTranslation('common');
  const { t: tDash } = useTranslation('dashboard');
  const { t: tPay } = useTranslation('payments');
  const { t: tSub } = useTranslation('subscriptions');
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

  const key = sectionTitleKey(location.pathname);
  const sectionTitle =
    key === 'pricingTitle'
      ? tPay(key)
      : key === 'checkInTitle'
        ? tSub(key)
        : tDash(key as 'adsDashboard');

  return (
    <div className={shell.shell} data-testid="owner-layout">
      <div className={shell.inner}>
        {!desktop ? (
          <div className={shell.mobileBar}>
            <button
              type="button"
              className={shell.menuBtn}
              aria-expanded={menuOpen}
              aria-controls={drawerId}
              onClick={() => setMenuOpen((open) => !open)}
              data-testid="owner-menu-toggle"
            >
              <Menu size={22} strokeWidth={2} aria-hidden />
              <span className={shell.menuBtnLabel}>{tCommon('openMenu')}</span>
            </button>
            <p className={shell.mobileSection}>{sectionTitle}</p>
          </div>
        ) : (
          <aside className={shell.sidebar}>
            <OwnerNav />
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
                data-testid="owner-drawer-backdrop"
              />
              <aside
                id={drawerId}
                className={`${shell.drawer} ${shell.drawerOpen}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={drawerTitleId}
                data-testid="owner-mobile-drawer"
              >
                <div className={shell.drawerHeader}>
                  <span id={drawerTitleId} className={shell.drawerTitle}>
                    {tDash('adsDashboard')}
                  </span>
                  <button
                    type="button"
                    className={shell.drawerClose}
                    onClick={closeMenu}
                    aria-label={tCommon('close')}
                    data-testid="owner-drawer-close"
                  >
                    ×
                  </button>
                </div>
                <div className={shell.drawerBody}>
                  <OwnerNav onNavigate={closeMenu} showBrand={false} />
                </div>
              </aside>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
