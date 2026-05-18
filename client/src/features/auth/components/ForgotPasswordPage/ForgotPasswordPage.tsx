import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  PasswordResetConfirmSchema,
  PasswordResetRequestSchema,
} from '@growth-world/shared';

import { postForgotPassword, postResetPassword } from '../../api/authApi';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { OTPInput } from '../OTPInput/OTPInput';
import { PasswordStrengthMeter } from '../PasswordStrengthMeter/PasswordStrengthMeter';
import form from '../authForm.module.css';

type Step = 1 | 2 | 3;

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onStep1 = useCallback(async () => {
    setError('');
    const parsed = PasswordResetRequestSchema.safeParse({
      email: email.trim().toLowerCase(),
    });
    if (!parsed.success) {
      setError(t('validationHint'));
      return;
    }
    setSubmitting(true);
    try {
      await postForgotPassword(parsed.data);
      setStep(2);
      setCode('');
    } catch (e) {
      setError(getApiErrorMessage(e, tErrors));
    } finally {
      setSubmitting(false);
    }
  }, [email, t, tErrors]);

  const onStep3 = useCallback(async () => {
    setError('');
    const parsed = PasswordResetConfirmSchema.safeParse({
      email: email.trim().toLowerCase(),
      code,
      newPassword,
      confirmNewPassword,
    });
    if (!parsed.success) {
      setError(t('validationHint'));
      return;
    }
    setSubmitting(true);
    try {
      await postResetPassword(parsed.data);
      navigate('/login', { replace: true, state: { resetSuccess: true } });
    } catch (e) {
      setError(getApiErrorMessage(e, tErrors));
    } finally {
      setSubmitting(false);
    }
  }, [code, confirmNewPassword, email, navigate, newPassword, t, tErrors]);

  return (
    <section className={form.form} data-testid="forgot-password-page">
      <header className={form.header}>
        <h1 className={form.title}>{t('forgotPasswordTitle')}</h1>
        <p className={form.subtitle}>{t('forgotPasswordSubtitle')}</p>
      </header>
      {error ? (
        <p className={form.error} role="alert">
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <>
          <div className={form.field}>
            <label className={form.label} htmlFor="fp-email">
              {t('email')}
            </label>
            <input
              id="fp-email"
              className={form.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
            />
          </div>
          <div className={form.actions}>
            <Link to="/login" className="btnSecondary">
              {t('forgotPasswordBackToLogin')}
            </Link>
            <button
              type="button"
              className="btnPrimary"
              disabled={submitting}
              onClick={() => void onStep1()}
            >
              {t('sendResetLink')}
            </button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <h2 className={form.stepTitle}>{t('forgotPasswordStep2Title')}</h2>
          <p className={form.hint}>{t('forgotPasswordStep2Subtitle', { email: email.trim() })}</p>
          <OTPInput value={code} onChange={setCode} disabled={submitting} />
          <div className={form.actions}>
            <button
              type="button"
              className="btnSecondary"
              disabled={submitting}
              onClick={() => {
                setError('');
                setStep(1);
              }}
            >
              {t('back')}
            </button>
            <button
              type="button"
              className="btnPrimary"
              disabled={submitting || code.replace(/\D/g, '').length < 4}
              onClick={() => {
                setError('');
                setStep(3);
              }}
            >
              {t('next')}
            </button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <h2 className={form.stepTitle}>{t('newPasswordTitle')}</h2>
          <div className={form.field}>
            <label className={form.label} htmlFor="fp-pass">
              {t('password')}
            </label>
            <input
              id="fp-pass"
              className={form.input}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordStrengthMeter password={newPassword} />
          </div>
          <div className={form.field}>
            <label className={form.label} htmlFor="fp-pass2">
              {t('confirmPassword')}
            </label>
            <input
              id="fp-pass2"
              className={form.input}
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>
          <div className={form.actions}>
            <button
              type="button"
              className="btnSecondary"
              disabled={submitting}
              onClick={() => setStep(2)}
            >
              {t('back')}
            </button>
            <button
              type="button"
              className="btnPrimary"
              disabled={submitting}
              onClick={() => void onStep3()}
            >
              {t('resetPassword')}
            </button>
          </div>
        </>
      ) : null}

      <p className={form.footer}>
        <Link className={form.link} to="/login">
          {t('forgotPasswordBackToLogin')}
        </Link>
      </p>
    </section>
  );
}
