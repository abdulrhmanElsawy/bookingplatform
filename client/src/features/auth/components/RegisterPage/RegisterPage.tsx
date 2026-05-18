import { Check } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterSchema } from '@growth-world/shared';

import {
  patchAccountType,
  postRegister,
  postResendVerification,
  postVerifyEmail,
  type RegisterBody,
} from '../../api/authApi';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { OTPInput } from '../OTPInput/OTPInput';
import { PasswordStrengthMeter } from '../PasswordStrengthMeter/PasswordStrengthMeter';
import {
  RoleSelector,
  type RegistrationRole,
} from '../RoleSelector/RoleSelector';
import { mapApiUserToSession, useAuthStore } from '../../../../store/authStore';
import { useLanguage } from '../../../../hooks/useLanguage';
import form from '../authForm.module.css';

import styles from './RegisterPage.module.css';

type Step = 1 | 2 | 3;

const STEP_LABEL_KEYS = ['step1Title', 'step2Title', 'step3Title'] as const;

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
}

function buildRegisterBody(formState: FormState): RegisterBody {
  const phone = formState.phone.trim();
  if (phone.length > 0) {
    return {
      email: formState.email.trim().toLowerCase(),
      password: formState.password,
      confirmPassword: formState.confirmPassword,
      firstName: formState.firstName.trim(),
      lastName: formState.lastName.trim(),
      phone,
    };
  }
  return {
    email: formState.email.trim().toLowerCase(),
    password: formState.password,
    confirmPassword: formState.confirmPassword,
    firstName: formState.firstName.trim(),
    lastName: formState.lastName.trim(),
  };
}

function RegisterStepper({ step }: { step: Step }) {
  const { t } = useTranslation('auth');

  return (
    <div
      className={styles.stepper}
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={3}
      aria-label={t('stepIndicator', { current: step, total: 3 })}
    >
      {([1, 2, 3] as const).map((n) => {
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} className={styles.stepItem}>
            <div className={styles.stepTrack} aria-hidden>
              <div
                className={styles.stepTrackFill}
                style={{ width: done || active ? '100%' : '0%' }}
              />
            </div>
            <span
              className={`${styles.stepDot} ${active ? styles.stepDotActive : ''} ${done ? styles.stepDotDone : ''}`}
              aria-hidden
            >
              {done ? <Check size={14} strokeWidth={2.5} /> : n}
            </span>
            <span
              className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ''}`}
            >
              {t(STEP_LABEL_KEYS[n - 1])}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const { switchLanguage } = useLanguage();
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<Step>(1);
  const [formState, setFormState] = useState<FormState>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<RegistrationRole>('user');
  const [remoteError, setRemoteError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendSec, setResendSec] = useState(0);

  useEffect(() => {
    if (step !== 2) {
      return;
    }
    setResendSec(60);
    const id = window.setInterval(() => {
      setResendSec((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step]);

  const updateField = useCallback((key: keyof FormState, value: string) => {
    setFormState((f) => ({ ...f, [key]: value }));
  }, []);

  const onStep1Next = useCallback(async () => {
    setRemoteError('');
    const body = buildRegisterBody(formState);
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      setRemoteError(t('validationHint'));
      return;
    }
    setSubmitting(true);
    try {
      await postRegister(parsed.data);
      setStep(2);
      setOtp('');
    } catch (e) {
      setRemoteError(getApiErrorMessage(e, tErrors));
    } finally {
      setSubmitting(false);
    }
  }, [formState, t, tErrors]);

  const onStep2Verify = useCallback(async () => {
    setRemoteError('');
    if (otp.length !== 6) {
      setRemoteError(t('validationHint'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await postVerifyEmail({
        email: formState.email.trim().toLowerCase(),
        code: otp,
      });
      const session = mapApiUserToSession(res.user);
      if (session) {
        setSession(session);
        const lang = session.preferences?.language;
        if (lang === 'en' || lang === 'ar') {
          switchLanguage(lang);
        }
      }
      setStep(3);
    } catch (e) {
      setRemoteError(getApiErrorMessage(e, tErrors));
    } finally {
      setSubmitting(false);
    }
  }, [formState.email, otp, setSession, switchLanguage, t, tErrors]);

  const onResend = useCallback(async () => {
    if (resendSec > 0) return;
    setRemoteError('');
    setSubmitting(true);
    try {
      await postResendVerification(formState.email.trim().toLowerCase());
      setResendSec(60);
    } catch (e) {
      setRemoteError(getApiErrorMessage(e, tErrors));
    } finally {
      setSubmitting(false);
    }
  }, [formState.email, resendSec, t, tErrors]);

  const onFinish = useCallback(async () => {
    setRemoteError('');
    setSubmitting(true);
    try {
      const res = await patchAccountType(role);
      const session = mapApiUserToSession(res.user);
      if (session) {
        setSession(session);
        const lang = session.preferences?.language;
        if (lang === 'en' || lang === 'ar') {
          switchLanguage(lang);
        }
      }
      navigate(role === 'gym_owner' ? '/owner/listings' : '/', {
        ...(role === 'gym_owner' ? { state: { welcome: true } } : {}),
      });
    } catch (e) {
      setRemoteError(getApiErrorMessage(e, tErrors));
    } finally {
      setSubmitting(false);
    }
  }, [navigate, role, setSession, switchLanguage, t, tErrors]);

  return (
    <div className={form.form} data-testid="register-page">
      <header className={form.header}>
        <h1 className={form.title}>{t('registerTitle')}</h1>
        <p className={form.subtitle}>{t('registerSubtitle')}</p>
      </header>

      <RegisterStepper step={step} />

      {remoteError ? (
        <p className={form.error} role="alert">
          {remoteError}
        </p>
      ) : null}

      {step === 1 ? (
        <section aria-label={t('step1Title')}>
          <div className={styles.nameRow}>
            <div className={form.field}>
              <label className={form.label} htmlFor="reg-first">
                {t('firstName')}
              </label>
              <input
                id="reg-first"
                className={form.input}
                value={formState.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className={form.field}>
              <label className={form.label} htmlFor="reg-last">
                {t('lastName')}
              </label>
              <input
                id="reg-last"
                className={form.input}
                value={formState.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className={form.field}>
            <label className={form.label} htmlFor="reg-email">
              {t('email')}
            </label>
            <input
              id="reg-email"
              className={form.input}
              type="email"
              inputMode="email"
              value={formState.email}
              onChange={(e) => updateField('email', e.target.value)}
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
            />
          </div>
          <div className={form.field}>
            <label className={form.label} htmlFor="reg-phone">
              {t('phone')}
            </label>
            <input
              id="reg-phone"
              className={form.input}
              type="tel"
              value={formState.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className={form.field}>
            <label className={form.label} htmlFor="reg-pass">
              {t('password')}
            </label>
            <input
              id="reg-pass"
              className={form.input}
              type="password"
              value={formState.password}
              onChange={(e) => updateField('password', e.target.value)}
              autoComplete="new-password"
              placeholder={t('passwordPlaceholder')}
            />
            <PasswordStrengthMeter password={formState.password} />
          </div>
          <div className={form.field}>
            <label className={form.label} htmlFor="reg-pass2">
              {t('confirmPassword')}
            </label>
            <input
              id="reg-pass2"
              className={form.input}
              type="password"
              value={formState.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className={`${form.actions} ${form.actionsEnd}`}>
            <button
              type="button"
              className={`btnPrimary ${form.btnBlock}`}
              disabled={submitting}
              onClick={() => void onStep1Next()}
            >
              {t('next')}
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section aria-label={t('step2Title')}>
          <p className={form.hint}>{t('otpSubtitle', { email: formState.email.trim() })}</p>
          <OTPInput value={otp} onChange={setOtp} disabled={submitting} />
          <div className={form.resendRow}>
            <button
              type="button"
              className="btnSecondary"
              disabled={submitting || resendSec > 0}
              onClick={() => void onResend()}
            >
              {t('otpResend')}
            </button>
            {resendSec > 0 ? (
              <span className={form.resendMuted}>
                {t('otpResendIn', { seconds: resendSec })}
              </span>
            ) : null}
          </div>
          <div className={form.actions}>
            <button
              type="button"
              className="btnSecondary"
              disabled={submitting}
              onClick={() => {
                setRemoteError('');
                setStep(1);
              }}
            >
              {t('back')}
            </button>
            <button
              type="button"
              className="btnPrimary"
              disabled={submitting}
              onClick={() => void onStep2Verify()}
            >
              {t('verifyEmail')}
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section aria-label={t('step3Title')}>
          <p className={form.hint}>{t('step3Hint')}</p>
          <RoleSelector value={role} onChange={setRole} />
          <div className={`${form.actions} ${form.actionsEnd}`}>
            <button
              type="button"
              className={`btnPrimary ${form.btnBlock}`}
              disabled={submitting}
              onClick={() => void onFinish()}
            >
              {t('finish')}
            </button>
          </div>
        </section>
      ) : null}

      <footer className={form.footer}>
        <span>{t('alreadyHaveAccount')} </span>
        <Link className={form.footerLink} to="/login">
          {t('loginLink')}
        </Link>
      </footer>
    </div>
  );
}
