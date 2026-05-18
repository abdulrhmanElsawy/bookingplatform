import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router-dom';

import { useLanguage } from '../../../../hooks/useLanguage';
import { formatSarCurrency } from '../../../../utils/formatDashboardNumber';
import {
  fetchPaymentPlans,
  isPaymentPlanKey,
  postSimulateCheckout,
  type PlanCatalogDto,
} from '../../api/paymentsApi';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import styles from '../paymentsPages.module.css';

function planTitleNsKey(key: PlanCatalogDto['key']): string {
  const map: Record<PlanCatalogDto['key'], string> = {
    free: 'freePlan',
    basic: 'basicPlan',
    pro: 'proPlan',
    enterprise: 'enterprisePlan',
  };
  return map[key];
}

export function PaymentCheckoutPage() {
  const { planKey: planKeyParam } = useParams<{ planKey: string }>();
  const { t } = useTranslation('payments');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const lang = currentLang === 'en' ? 'en' : 'ar';
  const queryClient = useQueryClient();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  if (!isPaymentPlanKey(planKeyParam)) {
    return <Navigate to="/owner/plans" replace />;
  }

  const planKey = planKeyParam;

  const plansQuery = useQuery({
    queryKey: ['payment-plans'],
    queryFn: fetchPaymentPlans,
  });

  const plan = plansQuery.data?.find((p) => p.key === planKey);

  const mutation = useMutation({
    mutationFn: () => postSimulateCheckout(planKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
    },
  });

  if (plansQuery.isSuccess && !plan) {
    return <Navigate to="/owner/plans" replace />;
  }

  const canSubmit =
    !mutation.isPending &&
    cardNumber.trim().length > 0 &&
    expiry.trim().length > 0 &&
    cvv.trim().length > 0;

  return (
    <div className={styles.shell} data-testid="owner-checkout-page">
      <Link className={styles.back} to="/owner/plans" data-testid="checkout-back">
        {t('backToPlans')}
      </Link>
      <h1 className={styles.title}>{t('checkoutTitle')}</h1>
      <p className={styles.sub}>{t('testModeNote')}</p>

      {plansQuery.isLoading ? <p>{tCommon('loading')}</p> : null}
      {plansQuery.isError ? (
        <p className={styles.error} role="alert">
          {getApiErrorMessage(plansQuery.error, tErrors)}
        </p>
      ) : null}

      {mutation.isSuccess ? (
        <div className={styles.success} data-testid="checkout-success">
          <p className={styles.successTitle}>{t('paymentSuccess')}</p>
          <p>{t('paymentSuccessDesc')}</p>
          <Link className={`${styles.planCta} ${styles.successBack}`} to="/owner/plans">
            {t('backToPlans')}
          </Link>
        </div>
      ) : null}

      {!mutation.isSuccess && plan ? (
        <div className={styles.checkoutCard}>
          <div className={styles.note}>{t('paymentSimulated')}</div>
          <section className={styles.summary} aria-label={t('orderSummary')}>
            <h2 className={styles.sectionTitle}>{t('orderSummary')}</h2>
            <div className={styles.summaryRow}>
              <span>{t('planLabel')}</span>
              <span>{t(planTitleNsKey(plan.key))}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>{t('subtotal')}</span>
              <span>{formatSarCurrency(plan.price, lang)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>{t('tax')}</span>
              <span>{formatSarCurrency(0, lang)}</span>
            </div>
            <div className={styles.summaryRow}>
              <strong>{t('total')}</strong>
              <strong>{formatSarCurrency(plan.price, lang)}</strong>
            </div>
          </section>

          <section aria-label={t('paymentMethod')}>
            <h2 className={styles.sectionTitle}>{t('paymentMethod')}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) mutation.mutate();
              }}
            >
              <div className={styles.field}>
                <label className={styles.label} htmlFor="pay-card">
                  {t('cardNumber')}
                </label>
                <input
                  id="pay-card"
                  className={styles.input}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  autoComplete="off"
                  inputMode="numeric"
                  data-testid="checkout-card"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="pay-expiry">
                  {t('expiryDate')}
                </label>
                <input
                  id="pay-expiry"
                  className={styles.input}
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  autoComplete="off"
                  data-testid="checkout-expiry"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="pay-cvv">
                  {t('cvv')}
                </label>
                <input
                  id="pay-cvv"
                  className={styles.input}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  autoComplete="off"
                  inputMode="numeric"
                  data-testid="checkout-cvv"
                />
              </div>
              {mutation.isError ? (
                <p className={styles.error} role="alert">
                  {getApiErrorMessage(mutation.error, tErrors)}
                </p>
              ) : null}
              <button type="submit" className={styles.btn} disabled={!canSubmit} data-testid="checkout-submit">
                {t('completePayment')}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
