import { ContactSupportBodySchema } from '@growth-world/shared';
import { useMutation } from '@tanstack/react-query';
import { CircleHelp, Mail } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Accordion, type AccordionItem } from '../../../../components/shared/Accordion';
import i18n from '../../../../i18n';
import { useSEO } from '../../../../hooks/useSEO';
import { useAuthStore } from '../../../../store/authStore';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import form from '../../../auth/components/authForm.module.css';
import { postSupportContact, SupportApiError } from '../../api/supportApi';
import styles from './HelpPage.module.css';

const FAQ_COUNT = 8;

export function HelpPage() {
  const { t } = useTranslation('help');
  const { t: tErrors } = useTranslation('errors');

  useSEO({
    titleAr: i18n.getFixedT('ar', 'help')('seoTitle'),
    titleEn: i18n.getFixedT('en', 'help')('seoTitle'),
    descAr: i18n.getFixedT('ar', 'help')('seoDesc'),
    descEn: i18n.getFixedT('en', 'help')('seoDesc'),
    path: '/help',
  });

  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [clientError, setClientError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    if (fullName && !name) setName(fullName);
    if (user.email && !email) setEmail(user.email);
  }, [user, name, email]);

  const faqItems: AccordionItem[] = useMemo(
    () =>
      Array.from({ length: FAQ_COUNT }, (_, i) => {
        const n = i + 1;
        return {
          id: `faq-${n}`,
          question: t(`faqQ${n}`),
          answer: t(`faqA${n}`),
        };
      }),
    [t],
  );

  const mutation = useMutation({
    mutationFn: () =>
      postSupportContact({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        website: website.trim() || undefined,
      }),
    onSuccess: () => {
      setSent(true);
      setClientError('');
      setSubject('');
      setMessage('');
      setWebsite('');
    },
  });

  const errorMessage = useMemo(() => {
    if (clientError) return clientError;
    if (!mutation.isError) return '';
    if (mutation.error instanceof SupportApiError && mutation.error.status === 429) {
      return tErrors('rateLimited');
    }
    return getApiErrorMessage(mutation.error, tErrors);
  }, [clientError, mutation.isError, mutation.error, tErrors]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setClientError('');
    const parsed = ContactSupportBodySchema.safeParse({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      website: website.trim() || undefined,
    });
    if (!parsed.success) {
      setClientError(tErrors('validation'));
      return;
    }
    if (website.trim()) return;
    mutation.mutate();
  }

  return (
    <div className={styles.page} data-testid="help-page">
      <header className={styles.hero}>
        <h1 className={styles.title}>
          <CircleHelp size={32} aria-hidden style={{ verticalAlign: 'middle', marginInlineEnd: 8 }} />
          {t('pageTitle')}
        </h1>
        <p className={styles.subtitle}>{t('pageSubtitle')}</p>
      </header>

      <div className={styles.grid}>
        <section aria-labelledby="help-faq-heading">
          <h2 id="help-faq-heading" className={styles.sectionTitle}>
            {t('faqHeading')}
          </h2>
          <Accordion items={faqItems} />
        </section>

        <section aria-labelledby="help-contact-heading">
          <h2 id="help-contact-heading" className={styles.sectionTitle}>
            <Mail size={22} aria-hidden style={{ verticalAlign: 'middle', marginInlineEnd: 6 }} />
            {t('contactHeading')}
          </h2>
          <div className={styles.contactCard}>
            <p className={styles.contactIntro}>{t('contactSubtitle')}</p>

            {sent ? (
              <div className={styles.successBox} data-testid="help-contact-success">
                <p className={styles.successTitle}>{t('successTitle')}</p>
                <p className={styles.successBody}>{t('successBody')}</p>
              </div>
            ) : (
              <form className={form.form} onSubmit={handleSubmit} noValidate>
                <div className={form.field}>
                  <label className={form.label} htmlFor="help-name">
                    {t('fieldName')}
                  </label>
                  <input
                    id="help-name"
                    className={form.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                    data-testid="help-field-name"
                  />
                </div>
                <div className={form.field}>
                  <label className={form.label} htmlFor="help-email">
                    {t('fieldEmail')}
                  </label>
                  <input
                    id="help-email"
                    className={form.input}
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    data-testid="help-field-email"
                  />
                </div>
                <div className={form.field}>
                  <label className={form.label} htmlFor="help-subject">
                    {t('fieldSubject')}
                  </label>
                  <input
                    id="help-subject"
                    className={form.input}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    data-testid="help-field-subject"
                  />
                </div>
                <div className={form.field}>
                  <label className={form.label} htmlFor="help-message">
                    {t('fieldMessage')}
                  </label>
                  <textarea
                    id="help-message"
                    className={form.input}
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    maxLength={2000}
                    data-testid="help-field-message"
                  />
                </div>
                <label className={styles.honeypot} htmlFor="help-website">
                  Website
                  <input
                    id="help-website"
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
                {errorMessage ? (
                  <p className={styles.error} role="alert">
                    {errorMessage}
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="btnPrimary"
                  disabled={mutation.isPending}
                  data-testid="help-submit"
                >
                  {mutation.isPending ? t('submitting') : t('submit')}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
