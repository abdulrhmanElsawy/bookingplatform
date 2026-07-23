import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import { useLanguage } from '../../../../hooks/useLanguage';
import { mapApiUserToSession, useAuthStore } from '../../../../store/authStore';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { postResendVerification, postVerifyEmail } from '../../api/authApi';
import { OTPInput } from '../OTPInput/OTPInput';
import form from '../authForm.module.css';

export function VerifyEmailPage() {
  const { t } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const [searchParams] = useSearchParams();
  const { switchLanguage } = useLanguage();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState(() => searchParams.get('email')?.trim().toLowerCase() ?? '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendSec, setResendSec] = useState(0);

  useEffect(() => {
    if (resendSec <= 0) return;
    const id = window.setInterval(() => {
      setResendSec((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendSec]);

  const onVerify = useCallback(async () => {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || otp.length !== 6) {
      setError(t('validationHint'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await postVerifyEmail({ email: normalizedEmail, code: otp });
      const session = mapApiUserToSession(res.user);
      if (session) {
        setSession(session);
        const lang = session.preferences?.language;
        if (lang === 'en' || lang === 'ar') {
          switchLanguage(lang);
        }
      }
      setSuccess(true);
    } catch (e) {
      setError(getApiErrorMessage(e, tErrors));
    } finally {
      setSubmitting(false);
    }
  }, [email, otp, setSession, switchLanguage, t, tErrors]);

  const onResend = useCallback(async () => {
    if (resendSec > 0) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError(t('validationHint'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await postResendVerification(normalizedEmail);
      setResendSec(60);
    } catch (e) {
      setError(getApiErrorMessage(e, tErrors));
    } finally {
      setSubmitting(false);
    }
  }, [email, resendSec, t, tErrors]);

  return (
    <section className={form.form} data-testid="verify-email-page">
      <header className={form.header}>
        <h1 className={form.title}>{t('verifyEmailPageTitle')}</h1>
        <p className={form.subtitle}>{t('verifyEmailPageSubtitle')}</p>
      </header>

      {error ? (
        <p className={form.error} role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <>
          <p className={form.banner} role="status">
            {t('verifyEmailSuccess')}
          </p>
          <div className={form.actions}>
            <Link to="/login" className="btnPrimary">
              {t('verifyEmailContinueLogin')}
            </Link>
            <Link to="/" className="btnSecondary">
              {t('verifyEmailContinueHome')}
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className={form.field}>
            <label className={form.label} htmlFor="verify-email">
              {t('email')}
            </label>
            <input
              id="verify-email"
              className={form.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
            />
          </div>
          <h2 className={form.stepTitle}>{t('otpTitle')}</h2>
          <p className={form.hint}>
            {email.trim()
              ? t('otpSubtitle', { email: email.trim().toLowerCase() })
              : t('otpHint')}
          </p>
          <OTPInput value={otp} onChange={setOtp} disabled={submitting} />
          <div className={form.actions}>
            <button
              type="button"
              className="btnSecondary"
              disabled={submitting || resendSec > 0}
              onClick={() => void onResend()}
            >
              {resendSec > 0
                ? t('otpResendIn', { seconds: resendSec })
                : t('otpResend')}
            </button>
            <button
              type="button"
              className="btnPrimary"
              disabled={submitting || otp.length !== 6 || !email.trim()}
              onClick={() => void onVerify()}
            >
              {t('verifyEmail')}
            </button>
          </div>
        </>
      )}

      <footer className={form.footer}>
        <Link className={form.footerLink} to="/login">
          {t('loginLink')}
        </Link>
      </footer>
    </section>
  );
}
