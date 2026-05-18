import { getLocalizedValue } from '@growth-world/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';

import { useLanguage } from '../../../../hooks/useLanguage';
import { useSubscriptionT } from '../../i18n/useSubscriptionT';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { formatCurrency } from '../../../../utils/formatters';
import { getListingName } from '../../../../utils/listing';
import { fetchListingBySlug } from '../../../listings/api/listingsApi';
import {
  postSimulateVenueSubscription,
  type VenueSubscriptionDto,
} from '../../api/subscriptionsApi';
import styles from '../subscriptionPages.module.css';

export function VenueCheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const packageFromUrl = searchParams.get('package') ?? '';
  const { t } = useSubscriptionT();
  const { t: tListings } = useTranslation('listings');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();

  const [selectedPackageId, setSelectedPackageId] = useState(packageFromUrl);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState<VenueSubscriptionDto | null>(null);

  const listingQuery = useQuery({
    queryKey: ['listing', slug],
    queryFn: () => fetchListingBySlug(slug!),
    enabled: Boolean(slug),
  });

  const activePackages = useMemo(
    () => (listingQuery.data?.packages ?? []).filter((p) => p.isActive !== false),
    [listingQuery.data?.packages],
  );

  const resolvedPackageId = useMemo(() => {
    if (selectedPackageId && activePackages.some((p) => p._id === selectedPackageId)) {
      return selectedPackageId;
    }
    if (activePackages.length === 1) return activePackages[0]!._id;
    return '';
  }, [selectedPackageId, activePackages]);

  const selectedPackage = activePackages.find((p) => p._id === resolvedPackageId);

  const mutation = useMutation({
    mutationFn: () => postSimulateVenueSubscription(slug!, resolvedPackageId),
    onSuccess: (sub) => setCompleted(sub),
  });

  if (!slug) {
    return <Navigate to="/listings" replace />;
  }

  const canSubmit =
    Boolean(resolvedPackageId) &&
    !mutation.isPending &&
    cardNumber.trim().length > 0 &&
    expiry.trim().length > 0 &&
    cvv.trim().length > 0;

  const onCopy = async () => {
    if (!completed?.accessCode) return;
    try {
      await navigator.clipboard.writeText(completed.accessCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (completed) {
    const validUntil = new Date(completed.validUntil).toLocaleDateString(
      currentLang === 'en' ? 'en-SA' : 'ar-SA',
    );
    return (
      <div className={styles.page} data-testid="venue-checkout-page">
        <div className={styles.container}>
          <Link className={styles.backLink} to={`/listings/${slug}`}>
            ← {t('backToListing')}
          </Link>
          <div className={`${styles.card} ${styles.success}`}>
            <h1 className={styles.title}>{t('paymentSuccess')}</h1>
            <p className={styles.subtitle}>{t('paymentSuccessDesc')}</p>
            <p className={styles.label}>{t('accessCodeLabel')}</p>
            <p className={styles.accessCode} data-testid="subscription-access-code">
              {completed.accessCode}
            </p>
            <button type="button" className={styles.copyBtn} onClick={() => void onCopy()}>
              {copied ? t('copied') : t('copyCode')}
            </button>
            <p className={styles.subtitle}>
              {t('validUntil')}: {validUntil}
            </p>
            <div className={styles.linkRow}>
              <Link className={styles.linkBtn} to="/account/memberships">
                {t('viewMemberships')}
              </Link>
              <Link
                className={`${styles.linkBtn} ${styles.linkBtnSecondary}`}
                to={`/listings/${slug}`}
              >
                {t('backToListing')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} data-testid="venue-checkout-page">
      <div className={styles.container}>
        <Link className={styles.backLink} to={`/listings/${slug}`}>
          ← {t('backToListing')}
        </Link>
        <h1 className={styles.title}>{t('checkoutTitle')}</h1>
        <p className={styles.subtitle}>{t('checkoutSubtitle')}</p>

        {listingQuery.isLoading ? <p>{tCommon('loading')}</p> : null}
        {listingQuery.isError ? (
          <p className={styles.error} role="alert">
            {getApiErrorMessage(listingQuery.error, tErrors)}
          </p>
        ) : null}

        {listingQuery.isSuccess && activePackages.length === 0 ? (
          <div className={styles.card}>
            <p>{t('noPackages')}</p>
            <Link className={styles.linkBtn} to={`/listings/${slug}`}>
              {t('backToListing')}
            </Link>
          </div>
        ) : null}

        {listingQuery.isSuccess && activePackages.length > 0 ? (
          <div className={styles.card}>
            <div className={styles.note}>{t('paymentSimulated')}</div>

            {activePackages.length > 1 && !resolvedPackageId ? (
              <section>
                <h2 className={styles.sectionTitle}>{t('selectPackageTitle')}</h2>
                <div className={styles.packagePicker}>
                  {activePackages.map((pkg) => (
                    <label
                      key={pkg._id}
                      className={`${styles.packageOption} ${
                        selectedPackageId === pkg._id ? styles.packageOptionSelected : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="package"
                        value={pkg._id}
                        checked={selectedPackageId === pkg._id}
                        onChange={() => setSelectedPackageId(pkg._id)}
                      />
                      <span>
                        <strong>{getLocalizedValue(pkg.name, currentLang)}</strong>
                        <br />
                        {formatCurrency(pkg.price, currentLang)} ·{' '}
                        {tListings(`duration.${pkg.duration}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ) : null}

            {selectedPackage ? (
              <>
                <section aria-label={t('orderSummary')}>
                  <h2 className={styles.sectionTitle}>{t('orderSummary')}</h2>
                  <div className={styles.summaryRow}>
                    <span>{t('venueLabel')}</span>
                    <span>
                      {listingQuery.data
                        ? getListingName(listingQuery.data, currentLang)
                        : ''}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>{t('packageLabel')}</span>
                    <span>{getLocalizedValue(selectedPackage.name, currentLang)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>{t('durationLabel')}</span>
                    <span>{tListings(`duration.${selectedPackage.duration}`)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>{t('subtotal')}</span>
                    <span>{formatCurrency(selectedPackage.price, currentLang)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>{t('tax')}</span>
                    <span>{formatCurrency(0, currentLang)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <strong>{t('total')}</strong>
                    <strong>{formatCurrency(selectedPackage.price, currentLang)}</strong>
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
                      <label className={styles.label} htmlFor="venue-pay-card">
                        {t('cardNumber')}
                      </label>
                      <input
                        id="venue-pay-card"
                        className={styles.input}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        data-testid="checkout-card"
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="venue-pay-expiry">
                        {t('expiryDate')}
                      </label>
                      <input
                        id="venue-pay-expiry"
                        className={styles.input}
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        data-testid="checkout-expiry"
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="venue-pay-cvv">
                        {t('cvv')}
                      </label>
                      <input
                        id="venue-pay-cvv"
                        className={styles.input}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        data-testid="checkout-cvv"
                      />
                    </div>
                    {mutation.isError ? (
                      <p className={styles.error} role="alert">
                        {getApiErrorMessage(mutation.error, tErrors)}
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      className={styles.btn}
                      disabled={!canSubmit}
                      data-testid="checkout-submit"
                    >
                      {t('completePayment')}
                    </button>
                  </form>
                </section>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
