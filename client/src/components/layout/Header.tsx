import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Bell, CircleHelp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, createSearchParams } from 'react-router-dom';

import { BrandLogo } from '../brand/BrandLogo';
import { CategoryIcon } from '../shared/icons/categoryIcons';
import { CATEGORY_PILLS } from './headerCategoryPills';

import { logoutUser } from '../../features/auth/logout/logoutUser';
import { getUnreadNotificationCount } from '../../features/notifications/api/notificationsApi';
import { useLanguage } from '../../hooks/useLanguage';
import { useListYourGymPath } from '../../hooks/useListYourGymPath';
import { useAuthStore } from '../../store/authStore';
import type { SessionUser } from '../../store/authStore';
import styles from './Header.module.css';

const WIDE_QUERY = '(min-width: 768px)';

function useWideHeader() {
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(WIDE_QUERY).matches : true,
  );

  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const onChange = () => setWide(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return wide;
}

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
  const { t: tProfile } = useTranslation('profile');
  const { t: tDash } = useTranslation('dashboard');
  const { t: tPay } = useTranslation('payments');
  const { t: tSub } = useTranslation('subscriptions');
  const { t: tNotif } = useTranslation('notifications');
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
      queryClient.clear();
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
        <Link className={styles.drawerLink} to="/account/profile" onClick={itemAfterNav}>
          {tProfile('profileTitle')}
        </Link>
        <Link className={styles.drawerLink} to="/account/favorites" onClick={itemAfterNav}>
          {tProfile('favoritesTitle')}
        </Link>
        <Link className={styles.drawerLink} to="/account/memberships" onClick={itemAfterNav}>
          {tSub('membershipsTitle')}
        </Link>
        <Link className={styles.drawerLink} to="/owner/listings" onClick={itemAfterNav}>
          {tDash('myListings')}
        </Link>
        {role === 'gym_owner' ? (
          <>
            <Link className={styles.drawerLink} to="/owner" onClick={itemAfterNav}>
              {tDash('dashboardTitle')}
            </Link>
            <Link className={styles.drawerLink} to="/owner/reviews" onClick={itemAfterNav}>
              {tDash('reviewsManagement')}
            </Link>
            <Link className={styles.drawerLink} to="/owner/plans" onClick={itemAfterNav}>
              {tPay('pricingTitle')}
            </Link>
            <Link className={styles.drawerLink} to="/owner/check-in" onClick={itemAfterNav}>
              {tSub('checkInTitle')}
            </Link>
          </>
        ) : null}
        {role === 'admin' || role === 'super_admin' ? (
          <Link className={styles.drawerLink} to="/admin" onClick={itemAfterNav}>
            {t('adminPanel')}
          </Link>
        ) : null}
        <Link
          className={styles.drawerLinkBadge}
          to="/account/notifications"
          onClick={itemAfterNav}
        >
          {tNotif('notificationsTitle')}
        </Link>
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
          <Link className={styles.userMenuLink} role="menuitem" to="/account/profile" onClick={close}>
            {tProfile('profileTitle')}
          </Link>
          <Link className={styles.userMenuLink} role="menuitem" to="/account/favorites" onClick={close}>
            {tProfile('favoritesTitle')}
          </Link>
          <Link className={styles.userMenuLink} role="menuitem" to="/account/memberships" onClick={close}>
            {tSub('membershipsTitle')}
          </Link>
          <Link className={styles.userMenuLink} role="menuitem" to="/owner/listings" onClick={close}>
            {tDash('myListings')}
          </Link>
          {role === 'gym_owner' ? (
            <>
              <Link className={styles.userMenuLink} role="menuitem" to="/owner" onClick={close}>
                {tDash('dashboardTitle')}
              </Link>
              <Link className={styles.userMenuLink} role="menuitem" to="/owner/reviews" onClick={close}>
                {tDash('reviewsManagement')}
              </Link>
              <Link className={styles.userMenuLink} role="menuitem" to="/owner/plans" onClick={close}>
                {tPay('pricingTitle')}
              </Link>
              <Link className={styles.userMenuLink} role="menuitem" to="/owner/check-in" onClick={close}>
                {tSub('checkInTitle')}
              </Link>
            </>
          ) : null}
          {role === 'admin' || role === 'super_admin' ? (
            <Link className={styles.userMenuLink} role="menuitem" to="/admin" onClick={close}>
              {t('adminPanel')}
            </Link>
          ) : null}
          <Link
            className={styles.userMenuLinkBadge}
            role="menuitem"
            to="/account/notifications"
            onClick={close}
          >
            {tNotif('notificationsTitle')}
          </Link>
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
          const active = activeCategory === pill.slug;
          return (
            <Link
              key={pill.slug}
              className={`${styles.categoryPill} ${active ? styles.categoryPillActive : ''}`}
              to={{
                pathname: '/listings',
                search: createSearchParams({ category: pill.slug }).toString(),
              }}
              onClick={onNavigate}
            >
              <span className={styles.categoryIcon} aria-hidden>
                <CategoryIcon slug={pill.slug} size={18} />
              </span>
              {t(pill.labelKey)}
            </Link>
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
    </nav>
  );
}

function HeaderTopAuth({
  wide,
  onNavigate,
}: {
  wide: boolean;
  onNavigate?: () => void;
}) {
  const { t: tAuth } = useTranslation('auth');
  const { t: tNotif } = useTranslation('notifications');
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrateFromServer = useAuthStore((s) => s.hydrateFromServer);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: getUnreadNotificationCount,
    enabled: isAuthenticated && sessionStatus === 'ready',
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (sessionStatus === 'pending') {
      void hydrateFromServer();
    }
  }, [sessionStatus, hydrateFromServer]);

  if (sessionStatus === 'pending') {
    return <AuthSkeleton testId="nav-auth-skeleton" />;
  }

  if (sessionStatus === 'ready' && isAuthenticated) {
    return wide ? (
      <>
        <Link
          className={styles.navLinkWithBadge}
          to="/account/notifications"
          onClick={onNavigate}
          data-testid="nav-notifications"
          aria-label={
            unreadCount > 0
              ? tNotif('unreadNavLabel', { count: unreadCount })
              : tNotif('notificationsTitle')
          }
        >
          <Bell size={20} strokeWidth={2} aria-hidden />
          {unreadCount > 0 ? (
            <span className={styles.badge} data-testid="nav-notifications-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Link>
        <UserMenu variant="desktop" onNavigate={onNavigate} />
      </>
    ) : null;
  }

  if (sessionStatus === 'ready' && !isAuthenticated && wide) {
    return (
      <>
        <Link
          className={styles.registerBtn}
          to="/register"
          onClick={onNavigate}
          data-testid="nav-register"
        >
          {tAuth('signUpCta')}
        </Link>
        <Link
          className={styles.signInBtn}
          to="/login"
          onClick={onNavigate}
          data-testid="nav-login"
        >
          {tAuth('signInCta')}
        </Link>
      </>
    );
  }

  return null;
}

export function Header() {
  const { t } = useTranslation('common');
  const { t: tAuth } = useTranslation('auth');
  const location = useLocation();
  const wide = useWideHeader();
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
    if (!menuOpen || wide) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen, wide]);

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
          {wide ? (
            <>
              <button type="button" className={styles.currencyBtn} aria-label={t('currencySar')}>
                {t('currencySar')}
              </button>
              <a className={styles.helpBtn} href="#" onClick={(e) => e.preventDefault()} aria-label={t('help')}>
                <CircleHelp size={16} strokeWidth={2} aria-hidden />
              </a>
              <Link className={styles.listGymBtn} to={listYourGymPath} data-testid="nav-list-your-gym">
                {t('listYourGym')}
              </Link>
              <HeaderTopAuth wide={wide} />
              <HeaderLangToggle />
            </>
          ) : null}
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

      <CategoryNavRow onNavigate={wide ? undefined : closeMenu} />

      {!wide
        ? createPortal(
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
          <span id={drawerTitleId} className={styles.drawerTitle}>
            {t('mainNav')}
          </span>
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
          <button type="button" className={styles.drawerLink} disabled>
            {t('currencySar')}
          </button>
          <span className={styles.drawerLink}>{t('help')}</span>
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
            <AuthSkeleton />
          ) : null}
        </nav>
              </div>
            </>,
            document.body,
          )
        : null}
    </header>
  );
}
