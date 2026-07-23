import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LoginSchema } from '@growth-world/shared';

import { postLogin, type LoginBody, AuthApiError } from '../../api/authApi';
import { useLanguage } from '../../../../hooks/useLanguage';
import { mapApiUserToSession, useAuthStore } from '../../../../store/authStore';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import form from '../authForm.module.css';

const REMEMBER_EMAIL_KEY = 'gw_login_email';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const location = useLocation();
  const { switchLanguage } = useLanguage();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const consumedLocationState = useRef(false);

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (remembered) {
      setEmail(remembered);
    }
  }, []);

  useEffect(() => {
    if (consumedLocationState.current) return;
    const state = location.state as {
      authGuardMessage?: string;
      resetSuccess?: boolean;
    } | null;
    if (!state || (!state.authGuardMessage && !state.resetSuccess)) return;
    consumedLocationState.current = true;
    if (state.authGuardMessage) {
      setBanner(state.authGuardMessage);
    } else if (state.resetSuccess) {
      setBanner(t('resetSuccess'));
    }
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate, t]);

  const onSubmit = useCallback(async () => {
    setError('');
    const body: LoginBody = {
      email: email.trim().toLowerCase(),
      password,
    };
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      setError(t('validationHint'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await postLogin(parsed.data);
      const session = mapApiUserToSession(res.user);
      if (!session) {
        setError(tErrors('serverError'));
        return;
      }
      setSession(session);
      const lang = session.preferences?.language;
      if (lang === 'en' || lang === 'ar') {
        switchLanguage(lang);
      }
      if (remember) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, parsed.data.email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      const state = location.state as { from?: string } | null;
      const dest =
        state?.from && state.from.startsWith('/') ? state.from : '/';
      navigate(dest, { replace: true });
    } catch (e) {
      if (e instanceof AuthApiError && e.code === 'EMAIL_NOT_VERIFIED') {
        navigate(
          `/verify-email?email=${encodeURIComponent(parsed.data.email)}`,
          { replace: true },
        );
        return;
      }
      setError(getApiErrorMessage(e, tErrors));
    } finally {
      setSubmitting(false);
    }
  }, [
    email,
    location,
    navigate,
    password,
    remember,
    setSession,
    switchLanguage,
    t,
    tErrors,
  ]);

  return (
    <section className={form.form} data-testid="login-page">
      <header className={form.header}>
        <h1 className={form.title}>{t('loginTitle')}</h1>
        <p className={form.subtitle}>{t('loginSubtitle')}</p>
      </header>
      {banner ? (
        <p className={form.banner} role="status">
          {banner}
        </p>
      ) : null}
      {error ? (
        <p className={form.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={form.field}>
        <label className={form.label} htmlFor="login-email">
          {t('email')}
        </label>
        <input
          id="login-email"
          className={form.input}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
        />
      </div>
      <div className={form.field}>
        <label className={form.label} htmlFor="login-password">
          {t('password')}
        </label>
        <input
          id="login-password"
          className={form.input}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void onSubmit();
          }}
        />
      </div>
      <div className={form.rowBetween}>
        <label className={form.checkboxLabel}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          {t('rememberMe')}
        </label>
        <Link className={form.link} to="/forgot-password">
          {t('forgotPassword')}
        </Link>
      </div>
      <button
        type="button"
        className={`btnPrimary ${form.btnBlock}`}
        disabled={submitting}
        onClick={() => void onSubmit()}
      >
        {t('loginSubmit')}
      </button>
      <footer className={form.footer}>
        <span>{t('noAccount')} </span>
        <Link className={form.footerLink} to="/register">
          {t('registerLink')}
        </Link>
      </footer>
    </section>
  );
}
