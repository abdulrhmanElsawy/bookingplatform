import { getLocalizedValue } from '@growth-world/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { SelectField } from '../../../../components/shared/SelectField';
import { useLanguage } from '../../../../hooks/useLanguage';
import { useSubscriptionT } from '../../i18n/useSubscriptionT';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { fetchOwnerListings } from '../../../dashboard/api/dashboardApi';
import { verifyAccessCode, type VerifyAccessCodeResult } from '../../api/subscriptionsApi';
import styles from '../subscriptionPages.module.css';

export function OwnerCheckInPage() {
  const { t } = useSubscriptionT();
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const [code, setCode] = useState('');
  const [listingId, setListingId] = useState('');
  const [result, setResult] = useState<VerifyAccessCodeResult | null>(null);

  const listingsQuery = useQuery({
    queryKey: ['owner-listings'],
    queryFn: fetchOwnerListings,
  });

  const mutation = useMutation({
    mutationFn: () =>
      verifyAccessCode(code.trim(), listingId.trim() ? listingId : undefined),
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className={styles.page} data-testid="owner-check-in-page">
      <div className={styles.container}>
        <Link className={styles.backLink} to="/owner">
          ← {t('backToDashboard')}
        </Link>
        <h1 className={styles.title}>{t('checkInTitle')}</h1>
        <p className={styles.subtitle}>{t('checkInSubtitle')}</p>

        <div className={styles.card}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) mutation.mutate();
            }}
          >
            <div className={styles.field}>
              <label className={styles.label} htmlFor="check-in-code">
                {t('checkInCode')}
              </label>
              <input
                id="check-in-code"
                className={styles.input}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="GW-XXXXXXXX"
                data-testid="check-in-code"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="check-in-listing">
                {t('checkInListing')}
              </label>
              <SelectField
                id="check-in-listing"
                triggerClassName={styles.select}
                value={listingId}
                onChange={setListingId}
                placeholder={t('checkInAllListings')}
                options={[
                  { value: '', label: t('checkInAllListings') },
                  ...(listingsQuery.data ?? []).map((row) => ({
                    value: row._id,
                    label: getLocalizedValue(row.name, currentLang),
                  })),
                ]}
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
              disabled={!code.trim() || mutation.isPending}
              data-testid="check-in-submit"
            >
              {t('verifyButton')}
            </button>
          </form>

          {result?.valid ? (
            <div className={styles.verifyOk} data-testid="check-in-valid">
              <p>
                <strong>{t('verifyValid')}</strong>
              </p>
              <p>
                {t('verifyMember')}: {result.subscription.memberName}
              </p>
              <p>
                {t('packageLabel')}:{' '}
                {getLocalizedValue(result.subscription.packageName, currentLang)}
              </p>
              <p>
                {t('verifyExpires')}:{' '}
                {new Date(result.subscription.validUntil).toLocaleDateString(
                  currentLang === 'en' ? 'en-SA' : 'ar-SA',
                )}
              </p>
            </div>
          ) : null}

          {result && !result.valid ? (
            <div className={styles.verifyBad} data-testid="check-in-invalid">
              {t('verifyInvalid')}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
