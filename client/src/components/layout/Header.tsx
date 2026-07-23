import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { BrandLogo } from '../brand/BrandLogo';
import { CategoryNavPill } from './CategoryNavPill';
import { CATEGORY_PILLS } from './headerCategoryPills';

import { logoutUser } from '../../features/auth/logout/logoutUser';
import { useLanguage } from '../../hooks/useLanguage';
import { useListYourGymPath } from '../../hooks/useListYourGymPath';
import { useAuthStore } from '../../store/authStore';
import type { SessionUser } from '../../store/authStore';
import styles from './Header.module.css';

function initialsFromUser(user: SessionUser): string {
  const a = user.firstName?.trim()?.charAt(0) ?? '';
  const b = user.lastName?.trim()?.charAt(0) ?? '';
  const s = `${a}${b}`.toUpperCase();
  return s || user.email.charAt(0).toUpperCase();
}

type UserMenuProps = {
  variant: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

function UserMenu({ variant, onNavigate }: UserMenuProps) {
  const { t } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnId = useId();
  const listId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useLayoutEffect(() => {
    if (variant === 'mobile' || !open) return;
    const onScroll = () => close();
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [open, close, variant]);

  if (!user) return null;

  const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const role = user.role;

  const onSignOut = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logoutUser();
      close();
      onNavigate?.();
      navigate('/', { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const itemAfterNav = () => onNavigate?.();

  if (variant === 'mobile') {
    return (
      <div className={styles.mobileUserBlock}>
        <div className={styles.mobileUserHeader}>
          <span className={styles.userAvatar} aria-hidden>
            {initialsFromUser(user)}
          </span>
          <span className={styles.mobileUserName}>{displayName}</span>
        </div>
        <Link className={styles.drawerLink} to="/account" onClick={itemAfterNav}>
          {t('bottomNavAccount')}
        </Link>
        {role === 'gym_owner' ? (
          <Link className={styles.drawerLink} to="/owner" onClick={itemAfterNav}>
            {t('bottomNavYourClub')}
          </Link>
        ) : null}
        {role === 'admin' || role === 'super_admin' ? (
          <Link className={styles.drawerLink} to="/admin" onClick={itemAfterNav}>
            {t('adminPanel')}
          </Link>
        ) : null}
        <button
          type="button"
          className={styles.drawerSignOut}
          onClick={() => void onSignOut()}
          disabled={busy}
        >
          {t('signOut')}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.userMenuWrap} ref={wrapRef}>
      <button
        type="button"
        id={btnId}
        className={styles.userMenuButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t('accountMenu')}
        data-testid="nav-user-menu-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.userAvatar} aria-hidden>
          {initialsFromUser(user)}
        </span>
        <span className={styles.userMenuLabel}>{displayName}</span>
        <span className={styles.userMenuChevron} aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open ? (
        <div
          id={listId}
          className={styles.userMenuDropdown}
          role="menu"
          aria-labelledby={btnId}
        >
          <Link className={styles.userMenuLink} role="menuitem" to="/account" onClick={close}>
            {t('bottomNavAccount')}
          </Link>
          {role === 'gym_owner' ? (
            <Link className={styles.userMenuLink} role="menuitem" to="/owner" onClick={close}>
              {t('bottomNavYourClub')}
            </Link>
          ) : null}
          {role === 'admin' || role === 'super_admin' ? (
            <Link className={styles.userMenuLink} role="menuitem" to="/admin" onClick={close}>
              {t('adminPanel')}
            </Link>
          ) : null}
          <button
            type="button"
            className={styles.userMenuSignOut}
            role="menuitem"
            onClick={() => void onSignOut()}
            disabled={busy}
          >
            {t('signOut')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AuthSkeleton({ testId }: { testId?: string }) {
  return (
    <div className={styles.authSkeleton} data-testid={testId} aria-hidden>
      <span className={styles.authSkeletonCircle} />
      <span className={styles.authSkeletonBar} />
    </div>
  );
}

function HeaderLangToggle({ className }: { className?: string }) {
  const { t } = useTranslation('common');
  const { switchLanguage, currentLang } = useLanguage();

  return (
    <div
      id="gw-lang-toggle"
      className={`${styles.langToggle} ${className ?? ''}`.trim()}
      role="group"
      aria-label={t('language')}
    >
      <button
        type="button"
        className={currentLang === 'ar' ? styles.langActive : styles.langButton}
        onClick={() => void switchLanguage('ar')}
        data-testid="lang-ar"
        aria-pressed={currentLang === 'ar'}
      >
        <span lang="ar" dir="rtl">
          {t('arabic')}
        </span>
      </button>
      <span className={styles.langDivider} aria-hidden>
        |
      </span>
      <button
        type="button"
        className={currentLang === 'en' ? styles.langActive : styles.langButton}
        onClick={() => void switchLanguage('en')}
        data-testid="lang-en"
        aria-pressed={currentLang === 'en'}
      >
        <span lang="en" dir="ltr">
          {t('english')}
        </span>
      </button>
    </div>
  );
}

function CategoryNavRow({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation('common');
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeCategory = params.get('category') ?? '';

  return (
    <nav className={styles.headerNav} aria-label={t('categories')}>
      <div className={styles.categoryScroll}>
        {CATEGORY_PILLS.map((pill) => {
          const active =
            activeCategory === pill.slug ||
            (!activeCategory && location.pathname === '/' && pill.slug === 'gyms');
          return (
            <CategoryNavPill
              key={pill.slug}
              pill={pill}
              label={t(pill.labelKey)}
              active={active}
              onNavigate={onNavigate}
            />
          );
        })}
      </div>
      <Link
        className={styles.navSearchLink}
        to="/listings"
        onClick={onNavigate}
        data-testid="nav-search"
      >
        {t('search')}
      </Link>
      <Link
        className={styles.navSearchLink}
        to="/compare"
        onClick={onNavigate}
        data-testid="nav-compare"
      >
        {t('bottomNavCompare')}
      </Link>
    </nav>
  );
}

export function Header() {
  const { t } = useTranslation('common');
  const { t: tAuth } = useTranslation('auth');
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerId = useId();
  const drawerTitleId = useId();
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrateFromServer = useAuthStore((s) => s.hydrateFromServer);
  const listYourGymPath = useListYourGymPath();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  useEffect(() => {
    if (sessionStatus === 'pending') {
      void hydrateFromServer();
    }
  }, [sessionStatus, hydrateFromServer]);

  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, closeMenu]);

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <Link to="/" className={styles.brand} data-testid="header-brand">
          <BrandLogo variant="header" />
        </Link>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls={drawerId}
            aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
            onClick={() => setMenuOpen((o) => !o)}
            data-testid="header-menu-toggle"
          >
            {menuOpen ? (
              <span className={styles.menuCloseIcon} aria-hidden>
                ×
              </span>
            ) : (
              <span className={styles.menuIcon} aria-hidden />
            )}
          </button>
        </div>
      </div>

      <CategoryNavRow onNavigate={closeMenu} />

      {createPortal(
        <>
          {menuOpen ? (
            <button
              type="button"
              className={styles.drawerBackdrop}
              aria-label={t('closeMenu')}
              onClick={closeMenu}
              data-testid="header-drawer-backdrop"
            />
          ) : null}
          <div
            id={drawerId}
            className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}
            role="dialog"
            aria-modal={menuOpen}
            aria-hidden={!menuOpen}
            aria-labelledby={drawerTitleId}
            data-testid="header-mobile-drawer"
          >
            <div className={styles.drawerHeader}>
              <div className={styles.drawerBrandBlock}>
                <BrandLogo variant="header" />
                <span id={drawerTitleId} className={styles.drawerTitle}>
                  {t('mainNav')}
                </span>
              </div>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={closeMenu}
                aria-label={t('closeMenu')}
                data-testid="header-drawer-close"
              >
                ×
              </button>
            </div>
            <nav className={styles.drawerNav} aria-label={t('mainNav')}>
              <Link
                className={styles.drawerLink}
                to="/help"
                onClick={closeMenu}
                data-testid="drawer-help"
              >
                {t('help')}
              </Link>
              <Link
                className={styles.drawerLink}
                to="/compare"
                onClick={closeMenu}
                data-testid="drawer-compare"
              >
                {t('bottomNavCompare')}
              </Link>
              <Link
                className={styles.drawerLink}
                to={listYourGymPath}
                onClick={closeMenu}
                data-testid="nav-list-your-gym"
              >
                {t('listYourGym')}
              </Link>
              <HeaderLangToggle className={styles.drawerLang} />
              {sessionStatus === 'ready' && isAuthenticated ? (
                <UserMenu variant="mobile" onNavigate={closeMenu} />
              ) : sessionStatus === 'ready' && !isAuthenticated ? (
                <>
                  <Link className={styles.drawerLink} to="/login" onClick={closeMenu} data-testid="nav-login">
                    {tAuth('signInCta')}
                  </Link>
                  <Link
                    className={styles.drawerLink}
                    to="/register"
                    onClick={closeMenu}
                    data-testid="nav-register"
                  >
                    {tAuth('signUpCta')}
                  </Link>
                </>
              ) : sessionStatus === 'pending' ? (
                <AuthSkeleton testId="nav-auth-skeleton" />
              ) : null}
            </nav>
          </div>
        </>,
        document.body,
      )}
    </header>
  );
}
