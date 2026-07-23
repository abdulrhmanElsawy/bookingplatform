import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { deleteListing } from '../../../listings/api/listingsApi';
import { ensureGymOwner } from '../../../auth/utils/ensureGymOwner';
import { useLanguage } from '../../../../hooks/useLanguage';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { fetchOwnerListings, type OwnerListingRowDto } from '../../api/dashboardApi';
import styles from './OwnerListingsPage.module.css';

const STATUS_BADGE: Record<OwnerListingRowDto['status'], string> = {
  draft: styles.badgeDraft,
  pending: styles.badgePending,
  active: styles.badgeActive,
  rejected: styles.badgeRejected,
  suspended: styles.badgeSuspended,
};

function statusLabel(status: OwnerListingRowDto['status'], tCommon: (k: string) => string): string {
  return tCommon(status);
}

export function OwnerListingsPage() {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const lang = currentLang === 'en' ? 'en' : 'ar';
  const location = useLocation();
  const queryClient = useQueryClient();
  const welcome = Boolean((location.state as { welcome?: boolean } | null)?.welcome);
  const [deleteTarget, setDeleteTarget] = useState<OwnerListingRowDto | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    void ensureGymOwner();
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['owner-listings'],
    queryFn: fetchOwnerListings,
  });

  const deleteMutation = useMutation({
    mutationFn: (listingId: string) => deleteListing(listingId),
    onSuccess: async () => {
      setDeleteTarget(null);
      setDeleteError('');
      await queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
    },
    onError: (e: Error) => {
      setDeleteError(getApiErrorMessage(e, tErrors));
    },
  });

  const listings = data ?? [];

  return (
    <div className={styles.page} data-testid="owner-listings-page">
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{t('myAds')}</h1>
            <p className={styles.sub}>{t('myListingsSubtitle')}</p>
          </div>
          <Link
            className={styles.addBtn}
            to="/owner/listings/new"
            data-testid="add-venue-link"
            onClick={() => void ensureGymOwner()}
          >
            {t('addListing')}
          </Link>
        </header>

        {welcome ? (
          <p className={styles.welcome} data-testid="owner-welcome-banner">
            {t('ownerWelcomeBanner')}
          </p>
        ) : null}

        {deleteError ? (
          <p className={styles.error} role="alert">
            {deleteError}
          </p>
        ) : null}

        {isLoading ? <p>{tCommon('loading')}</p> : null}
        {isError ? (
          <p className={styles.error} role="alert">
            {getApiErrorMessage(error, tErrors)}
          </p>
        ) : null}

        {!isLoading && !isError && listings.length === 0 ? (
          <div className={styles.empty} data-testid="owner-listings-empty">
            <p className={styles.emptyTitle}>{t('myListingsEmptyTitle')}</p>
            <p className={styles.emptySub}>{t('myListingsEmptySub')}</p>
            <Link
              className={styles.addBtn}
              to="/owner/listings/new"
              onClick={() => void ensureGymOwner()}
            >
              {t('addListing')}
            </Link>
          </div>
        ) : null}

        {!isLoading && !isError && listings.length > 0 ? (
          <ul className={styles.list}>
            {listings.map((row) => {
              const name = lang === 'en' ? row.name.en : row.name.ar;
              const catName = row.category
                ? lang === 'en'
                  ? row.category.name.en
                  : row.category.name.ar
                : '';
              const rejection =
                row.status === 'rejected' && row.rejectionReason
                  ? lang === 'en'
                    ? row.rejectionReason.en
                    : row.rejectionReason.ar
                  : '';
              const isSuspended = row.status === 'suspended';
              return (
                <li key={row._id} className={styles.card} data-testid={`owner-listing-${row._id}`}>
                  <div className={styles.cardMain}>
                    <h2 className={styles.cardName}>{name}</h2>
                    {catName ? <p className={styles.cardMeta}>{catName}</p> : null}
                    <p className={styles.cardMeta}>
                      {t('listingUpdatedAt', {
                        date: new Date(row.updatedAt).toLocaleDateString(
                          lang === 'en' ? 'en-SA' : 'ar-SA',
                        ),
                      })}
                    </p>
                    {row.status === 'pending' ? (
                      <p className={styles.cardMeta}>{t('listingAwaitingApproval')}</p>
                    ) : null}
                    {isSuspended ? (
                      <p className={styles.rejection}>{t('listingSuspendedHint')}</p>
                    ) : null}
                    {rejection ? (
                      <p className={styles.rejection}>
                        {t('listingRejectionReason')}: {rejection}
                      </p>
                    ) : null}
                  </div>
                  <div className={styles.cardActions}>
                    <span
                      className={`${styles.badge} ${STATUS_BADGE[row.status]}`}
                      data-testid={`listing-status-${row.status}`}
                    >
                      {statusLabel(row.status, tCommon)}
                    </span>
                    {row.status === 'rejected' ? (
                      <Link
                        className={styles.resubmitLink}
                        to={`/owner/listings/${row._id}/edit`}
                        data-testid={`resubmit-listing-${row._id}`}
                      >
                        {t('editAndResubmit')}
                      </Link>
                    ) : isSuspended ? (
                      <span className={styles.disabledAction}>{t('editListing')}</span>
                    ) : (
                      <Link
                        className={styles.editLink}
                        to={`/owner/listings/${row._id}/edit`}
                        data-testid={`edit-listing-${row._id}`}
                      >
                        {t('editListing')}
                      </Link>
                    )}
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => {
                        setDeleteError('');
                        setDeleteTarget(row);
                      }}
                      data-testid={`delete-listing-${row._id}`}
                    >
                      {tCommon('delete')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-listing-title"
            data-testid="delete-listing-modal"
          >
            <h2 id="delete-listing-title" className={styles.modalTitle}>
              {t('confirmDeleteListingTitle')}
            </h2>
            <p className={styles.modalBody}>
              {t('confirmDeleteListingBody', {
                name: lang === 'en' ? deleteTarget.name.en : deleteTarget.name.ar,
              })}
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancel}
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
              >
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                className={styles.modalConfirm}
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                disabled={deleteMutation.isPending}
                data-testid="confirm-delete-listing"
              >
                {tCommon('delete')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
