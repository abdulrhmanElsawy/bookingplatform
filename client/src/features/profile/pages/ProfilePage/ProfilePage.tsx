import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Globe,
  Heart,
  Ticket,
  Lock,
  Monitor,
  User,
  type LucideIcon,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import authForm from '../../../auth/components/authForm.module.css';
import {
  getMe,
  patchUserPreferences,
  patchUserProfile,
  postChangePassword,
} from '../../../auth/api/authApi';
import { useLanguage } from '../../../../hooks/useLanguage';
import { mapApiUserToSession, useAuthStore } from '../../../../store/authStore';
import type { AppLang } from '../../../../hooks/useLanguage';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import styles from './ProfilePage.module.css';

type TabId = 'info' | 'notifications' | 'language' | 'security' | 'sessions';

const TAB_CONFIG: Array<{
  id: TabId;
  labelKey: 'myInfo' | 'notificationPrefs' | 'language' | 'security' | 'sessions';
  icon: LucideIcon;
}> = [
  { id: 'info', labelKey: 'myInfo', icon: User },
  { id: 'notifications', labelKey: 'notificationPrefs', icon: Bell },
  { id: 'language', labelKey: 'language', icon: Globe },
  { id: 'security', labelKey: 'security', icon: Lock },
  { id: 'sessions', labelKey: 'sessions', icon: Monitor },
];

export function ProfilePage() {
  const { t } = useTranslation('profile');
  const { t: tSub } = useTranslation('subscriptions');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { switchLanguage, currentLang } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [tab, setTab] = useState<TabId>('info');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [langBanner, setLangBanner] = useState(false);
  const [notifBanner, setNotifBanner] = useState(false);
  const [profileBanner, setProfileBanner] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [formError, setFormError] = useState('');

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: Boolean(user),
  });

  useEffect(() => {
    const raw = meQuery.data;
    if (!raw || typeof raw !== 'object') return;
    const fn = raw.firstName;
    const ln = raw.lastName;
    const ph = raw.phone;
    if (typeof fn === 'string') setFirstName(fn);
    if (typeof ln === 'string') setLastName(ln);
    if (typeof ph === 'string') setPhone(ph);
    else if (ph === undefined || ph === null) setPhone('');
    const prefs = raw.preferences as Record<string, unknown> | undefined;
    const n = prefs?.notifications as Record<string, unknown> | undefined;
    if (n && typeof n.email === 'boolean') setNotifEmail(n.email);
    if (n && typeof n.inApp === 'boolean') setNotifInApp(n.inApp);
  }, [meQuery.data]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone ?? '');
    const n = user.preferences?.notifications;
    if (n) {
      setNotifEmail(n.email);
      setNotifInApp(n.inApp);
    }
  }, [user]);

  const saveProfileMutation = useMutation({
    mutationFn: () =>
      patchUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      }),
    onSuccess: async () => {
      setProfileBanner(true);
      setFormError('');
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      const raw = await getMe();
      const session = raw ? mapApiUserToSession(raw) : null;
      if (session) setSession(session);
      window.setTimeout(() => setProfileBanner(false), 4000);
    },
    onError: (e: Error) => {
      setFormError(getApiErrorMessage(e, tErrors));
    },
  });

  const saveNotifMutation = useMutation({
    mutationFn: () =>
      patchUserPreferences({
        notifications: { email: notifEmail, inApp: notifInApp },
      }),
    onSuccess: async () => {
      setNotifBanner(true);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      const raw = await getMe();
      const session = raw ? mapApiUserToSession(raw) : null;
      if (session) setSession(session);
      window.setTimeout(() => setNotifBanner(false), 4000);
    },
  });

  const changePwdMutation = useMutation({
    mutationFn: () =>
      postChangePassword({
        currentPassword: pwdCurrent,
        newPassword: pwdNew,
        confirmNewPassword: pwdConfirm,
      }),
    onSuccess: () => {
      clearSession();
      navigate('/login', {
        state: { authGuardMessage: t('passwordChanged') },
      });
    },
    onError: (e: Error) => {
      setFormError(getApiErrorMessage(e, tErrors));
    },
  });

  const initials = useMemo(() => {
    const a = (firstName.trim()[0] ?? user?.firstName?.[0] ?? '').toUpperCase();
    const b = (lastName.trim()[0] ?? user?.lastName?.[0] ?? '').toUpperCase();
    return `${a}${b}` || '?';
  }, [firstName, lastName, user]);

  const displayName = useMemo(() => {
    const fn = firstName.trim() || user?.firstName || '';
    const ln = lastName.trim() || user?.lastName || '';
    return [fn, ln].filter(Boolean).join(' ') || user?.email || '';
  }, [firstName, lastName, user]);

  const panelTitle = useMemo(() => {
    const match = TAB_CONFIG.find((item) => item.id === tab);
    return match ? t(match.labelKey) : t('profileTitle');
  }, [tab, t]);

  function onSaveProfile(e: FormEvent): void {
    e.preventDefault();
    saveProfileMutation.mutate();
  }

  function onSaveNotifications(e: FormEvent): void {
    e.preventDefault();
    saveNotifMutation.mutate();
  }

  function onChangePassword(e: FormEvent): void {
    e.preventDefault();
    setFormError('');
    changePwdMutation.mutate();
  }

  async function pickLanguage(lang: AppLang): Promise<void> {
    await switchLanguage(lang);
    setLangBanner(true);
    window.setTimeout(() => setLangBanner(false), 4000);
    const raw = await getMe();
    const session = raw ? mapApiUserToSession(raw) : null;
    if (session) setSession(session);
  }

  return (
    <div className={styles.page} data-testid="profile-page">
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1 className={styles.title}>{t('profileTitle')}</h1>
          <p className={styles.subtitle}>{t('profileSubtitle')}</p>
        </header>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.userCard}>
              <div className={styles.avatar} aria-hidden>
                {initials}
              </div>
              <p className={styles.userName}>{displayName}</p>
              {user?.email ? <p className={styles.userEmail}>{user.email}</p> : null}
            </div>

            <nav className={styles.nav} role="tablist" aria-label={t('profileTitle')}>
              {TAB_CONFIG.map(({ id, labelKey, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className={tab === id ? styles.navItemActive : styles.navItem}
                  onClick={() => {
                    setTab(id);
                    setFormError('');
                  }}
                >
                  <Icon className={styles.navIcon} size={18} strokeWidth={2} aria-hidden />
                  {t(labelKey)}
                </button>
              ))}
              <Link className={styles.navItem} to="/account/favorites" role="tab">
                <Heart className={styles.navIcon} size={18} strokeWidth={2} aria-hidden />
                {t('myFavorites')}
              </Link>
              <Link className={styles.navItem} to="/account/memberships" role="tab">
                <Ticket className={styles.navIcon} size={18} strokeWidth={2} aria-hidden />
                {tSub('membershipsTitle')}
              </Link>
            </nav>
          </aside>

          <div className={styles.main} role="tabpanel">
            <h2 className={styles.panelTitle}>{panelTitle}</h2>

            {formError ? (
              <p className={authForm.error} role="alert">
                {formError}
              </p>
            ) : null}

            {tab === 'info' ? (
              <>
                {profileBanner ? (
                  <p className={authForm.banner} role="status">
                    {t('profileSaved')}
                  </p>
                ) : null}
                <form className={styles.form} onSubmit={onSaveProfile}>
                  <div className={authForm.field}>
                    <label className={authForm.label} htmlFor="pf-fn">
                      {t('firstName')}
                    </label>
                    <input
                      id="pf-fn"
                      className={authForm.input}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className={authForm.field}>
                    <label className={authForm.label} htmlFor="pf-ln">
                      {t('lastName')}
                    </label>
                    <input
                      id="pf-ln"
                      className={authForm.input}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  <div className={authForm.field}>
                    <label className={authForm.label} htmlFor="pf-ph">
                      {t('phone')}
                    </label>
                    <input
                      id="pf-ph"
                      className={authForm.input}
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btnPrimary"
                    disabled={saveProfileMutation.isPending}
                  >
                    {t('saveChanges')}
                  </button>
                </form>
              </>
            ) : null}

            {tab === 'notifications' ? (
              <>
                {notifBanner ? (
                  <p className={authForm.banner} role="status">
                    {t('notificationsSaved')}
                  </p>
                ) : null}
                <form className={styles.form} onSubmit={onSaveNotifications}>
                  <label className={authForm.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={notifEmail}
                      onChange={(e) => setNotifEmail(e.target.checked)}
                    />
                    <span>{t('notifyByEmail')}</span>
                  </label>
                  <label className={authForm.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={notifInApp}
                      onChange={(e) => setNotifInApp(e.target.checked)}
                    />
                    <span>{t('notifyInApp')}</span>
                  </label>
                  <button
                    type="submit"
                    className="btnPrimary"
                    disabled={saveNotifMutation.isPending}
                  >
                    {t('saveChanges')}
                  </button>
                </form>
              </>
            ) : null}

            {tab === 'language' ? (
              <>
                {langBanner ? (
                  <p className={authForm.banner} role="status">
                    {t('languageSaved')}
                  </p>
                ) : null}
                <p className={styles.muted}>{t('languagePreference')}</p>
                <div className={styles.langRow}>
                  <button
                    type="button"
                    className={`btnSecondary ${currentLang === 'ar' ? styles.langBtnActive : ''}`.trim()}
                    onClick={() => void pickLanguage('ar')}
                  >
                    {t('languageArabic')}
                  </button>
                  <button
                    type="button"
                    className={`btnSecondary ${currentLang === 'en' ? styles.langBtnActive : ''}`.trim()}
                    onClick={() => void pickLanguage('en')}
                  >
                    {t('languageEnglish')}
                  </button>
                </div>
              </>
            ) : null}

            {tab === 'security' ? (
              <form className={styles.form} onSubmit={onChangePassword}>
                <div className={authForm.field}>
                  <label className={authForm.label} htmlFor="pf-cp">
                    {t('currentPassword')}
                  </label>
                  <input
                    id="pf-cp"
                    className={authForm.input}
                    type="password"
                    autoComplete="current-password"
                    value={pwdCurrent}
                    onChange={(e) => setPwdCurrent(e.target.value)}
                    required
                  />
                </div>
                <div className={authForm.field}>
                  <label className={authForm.label} htmlFor="pf-np">
                    {t('newPassword')}
                  </label>
                  <input
                    id="pf-np"
                    className={authForm.input}
                    type="password"
                    autoComplete="new-password"
                    value={pwdNew}
                    onChange={(e) => setPwdNew(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className={authForm.field}>
                  <label className={authForm.label} htmlFor="pf-nc">
                    {t('confirmNewPassword')}
                  </label>
                  <input
                    id="pf-nc"
                    className={authForm.input}
                    type="password"
                    autoComplete="new-password"
                    value={pwdConfirm}
                    onChange={(e) => setPwdConfirm(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <button
                  type="submit"
                  className="btnPrimary"
                  disabled={changePwdMutation.isPending}
                >
                  {t('changePassword')}
                </button>
              </form>
            ) : null}

            {tab === 'sessions' ? (
              <>
                <h3 className={styles.sessionsTitle}>{t('activeSessions')}</h3>
                <p className={styles.muted}>{t('sessionsPlaceholder')}</p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
