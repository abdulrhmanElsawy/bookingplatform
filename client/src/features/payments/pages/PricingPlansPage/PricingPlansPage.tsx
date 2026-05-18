import { useQuery } from '@tanstack/react-query';
import { Receipt, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLanguage } from '../../../../hooks/useLanguage';
import { formatSarCurrency } from '../../../../utils/formatDashboardNumber';
import {
  fetchMyPaymentTransactions,
  fetchPaymentPlans,
  isPaymentPlanKey,
  PAYMENT_PLAN_KEYS,
  type PlanCatalogDto,
} from '../../api/paymentsApi';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import styles from './PricingPlansPage.module.css';

function planTitleNsKey(key: PlanCatalogDto['key']): string {
  const map: Record<PlanCatalogDto['key'], string> = {
    free: 'freePlan',
    basic: 'basicPlan',
    pro: 'proPlan',
    enterprise: 'enterprisePlan',
  };
  return map[key];
}

function sortPlans(plans: PlanCatalogDto[]): PlanCatalogDto[] {
  const order = new Map(PAYMENT_PLAN_KEYS.map((k, i) => [k, i]));
  return [...plans].sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0));
}

function formatTxDate(iso: string, lang: 'ar' | 'en'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const locale = lang === 'en' ? 'en-SA' : 'ar-SA';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    numberingSystem: lang === 'ar' ? 'arab' : 'latn',
  }).format(d);
}

export function PricingPlansPage() {
  const { t } = useTranslation('payments');
  const { t: tDash } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const isEn = currentLang === 'en';
  const lang = isEn ? 'en' : 'ar';

  const plansQuery = useQuery({
    queryKey: ['payment-plans'],
    queryFn: fetchPaymentPlans,
  });

  const txQuery = useQuery({
    queryKey: ['payment-transactions', 1],
    queryFn: () => fetchMyPaymentTransactions(1, 20),
  });

  const plans = plansQuery.data ? sortPlans(plansQuery.data) : [];

  return (
    <div className={styles.page} data-testid="owner-pricing-page">
      <div className={styles.container}>
        <Link className={styles.backLink} to="/owner">
          ←{' '}
          {tDash('backToOwnerDashboard', {
            defaultValue: isEn ? 'Back to dashboard' : 'العودة إلى لوحة التحكم',
          })}
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>{t('pricingTitle')}</h1>
          <p className={styles.sub}>
            {t('pricingSubtitle', {
              defaultValue: isEn
                ? 'Choose the right plan for your venue'
                : 'اختر الخطة المناسبة لمنشأتك',
            })}
          </p>
        </header>

        {plansQuery.isLoading ? (
          <p className={styles.loadingWrap}>{tCommon('loading')}</p>
        ) : null}

        {plansQuery.isError ? (
          <p className={styles.error} role="alert">
            {getApiErrorMessage(plansQuery.error, tErrors)}
          </p>
        ) : null}

        {plansQuery.isSuccess ? (
          <div className={styles.planGrid}>
            {plans.map((plan) => {
              const isPopular = plan.key === 'pro';
              return (
                <article
                  key={plan.key}
                  className={`${styles.planCard} ${isPopular ? styles.planCardPopular : ''}`}
                  data-testid={`plan-card-${plan.key}`}
                >
                  {isPopular ? (
                    <span className={styles.popularBadge}>
                      <Sparkles size={12} strokeWidth={2} aria-hidden />
                      {t('mostPopular')}
                    </span>
                  ) : null}
                  <h2 className={styles.planName}>{t(planTitleNsKey(plan.key))}</h2>
                  <p className={styles.planPrice}>
                    {formatSarCurrency(plan.price, lang)}
                    <span className={styles.perMonth}> {t('perMonth')}</span>
                  </p>
                  <Link
                    className={`${styles.planCta} ${isPopular ? styles.planCtaPrimary : ''}`}
                    to={`/owner/plans/${plan.key}/checkout`}
                    data-testid={`plan-cta-${plan.key}`}
                  >
                    {t('getStarted')}
                  </Link>
                </article>
              );
            })}
          </div>
        ) : null}

        <section className={styles.historySection} aria-labelledby="tx-history-title">
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon} aria-hidden>
              <Receipt size={18} strokeWidth={2} />
            </span>
            <h2 id="tx-history-title" className={styles.sectionTitle}>
              {t('transactionHistory')}
            </h2>
          </div>

          {txQuery.isLoading ? (
            <p className={styles.loadingWrap}>{tCommon('loading')}</p>
          ) : null}

          {txQuery.isError ? (
            <p className={styles.error} role="alert">
              {getApiErrorMessage(txQuery.error, tErrors)}
            </p>
          ) : null}

          {txQuery.isSuccess ? (
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">{t('transactionDate')}</th>
                    <th scope="col">{t('planLabel')}</th>
                    <th scope="col">{t('transactionAmount')}</th>
                    <th scope="col">{t('transactionStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {txQuery.data.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={styles.emptyCell}>
                        <span data-testid="tx-empty">—</span>
                      </td>
                    </tr>
                  ) : (
                    txQuery.data.transactions.map((row) => (
                      <tr key={row.id} data-testid={`tx-row-${row.id}`}>
                        <td>{formatTxDate(row.createdAt, lang)}</td>
                        <td>
                          {isPaymentPlanKey(row.planKey)
                            ? t(planTitleNsKey(row.planKey))
                            : row.planKey}
                        </td>
                        <td>{formatSarCurrency(row.amount, lang)}</td>
                        <td>
                          <span className={styles.statusBadge}>
                            {row.status === 'simulated' ? t('statusSimulated') : row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
