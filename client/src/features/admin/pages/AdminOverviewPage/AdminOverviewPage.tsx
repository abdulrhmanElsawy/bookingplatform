import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ListingsApiError, patchListingStatus } from '../../../listings/api/listingsApi';
import { useLanguage } from '../../../../hooks/useLanguage';
import { formatDashboardInteger } from '../../../../utils/formatDashboardNumber';
import { fetchAdminOverview } from '../../api/adminApi';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import type { AdminPendingListingRowDto } from '../../api/adminApi';
import { AdminLoadingBlock } from '../../components/AdminLoadingBlock/AdminLoadingBlock';
import { AdminPageHeader } from '../../components/AdminPageHeader/AdminPageHeader';
import { AdminStatusBadge } from '../../components/AdminStatusBadge/AdminStatusBadge';
import shell from '../../components/adminShell.module.css';

type RejectTarget = Pick<AdminPendingListingRowDto, '_id' | 'name'> | null;

export function AdminOverviewPage() {
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const lang = currentLang === 'en' ? 'en' : 'ar';
  const queryClient = useQueryClient();

  const [rejectionAr, setRejectionAr] = useState('');
  const [rejectionEn, setRejectionEn] = useState('');
  const [rejectTarget, setRejectTarget] = useState<RejectTarget>(null);
  const [modalAr, setModalAr] = useState('');
  const [modalEn, setModalEn] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: fetchAdminOverview,
  });

  const approveMutation = useMutation({
    mutationFn: (listingId: string) => patchListingStatus(listingId, { status: 'active' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (args: { listingId: string; rejectionReason: { ar: string; en: string } }) =>
      patchListingStatus(args.listingId, {
        status: 'rejected',
        rejectionReason: args.rejectionReason,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setRejectTarget(null);
      setModalAr('');
      setModalEn('');
    },
  });

  const statusBusy = approveMutation.isPending || rejectMutation.isPending;

  function openReject(row: AdminPendingListingRowDto) {
    setRejectTarget({ _id: row._id, name: row.name });
    setModalAr('');
    setModalEn('');
  }

  function closeReject() {
    if (rejectMutation.isPending) return;
    setRejectTarget(null);
    setModalAr('');
    setModalEn('');
  }

  const mutationError =
    approveMutation.error instanceof ListingsApiError
      ? getApiErrorMessage(approveMutation.error, tErrors)
      : rejectMutation.error instanceof ListingsApiError
        ? getApiErrorMessage(rejectMutation.error, tErrors)
        : null;

  return (
    <div data-testid="admin-overview-page">
      <AdminPageHeader title={t('overview')} subtitle={t('overviewSubtitle')} />

      {data ? (
        <div className={shell.queueGrid}>
          <Link
            className={`${shell.queueCard} ${data.pendingListings > 0 ? shell.queueCardAccent : ''}`}
            to="/admin/listings?status=pending"
            data-testid="admin-link-listings"
          >
            <p className={shell.queueCardTitle}>{t('queueListings')}</p>
            <p className={shell.queueCardMeta}>
              {t('queueListingsMeta', { count: data.pendingListings })}
            </p>
          </Link>
          <Link
            className={`${shell.queueCard} ${data.pendingReviews > 0 ? shell.queueCardAccent : ''}`}
            to="/admin/reviews"
            data-testid="admin-link-reviews"
          >
            <p className={shell.queueCardTitle}>{t('queueReviews')}</p>
            <p className={shell.queueCardMeta}>
              {t('queueReviewsMeta', { count: data.pendingReviews })}
            </p>
          </Link>
        </div>
      ) : null}

      {isLoading ? <AdminLoadingBlock /> : null}
      {isError ? (
        <p className={shell.error} role="alert">
          {getApiErrorMessage(error, tErrors)}
        </p>
      ) : null}

      {!isLoading && !isError && data ? (
        <>
          {mutationError ? (
            <p className={shell.error} role="alert">
              {mutationError}
            </p>
          ) : null}

          <div className={shell.gridStats} data-testid="admin-stats">
            <article className={shell.statCard}>
              <p className={shell.statLabel}>{t('totalUsers')}</p>
              <p className={shell.statValue}>{formatDashboardInteger(data.totalUsers, lang)}</p>
            </article>
            <article className={shell.statCard}>
              <p className={shell.statLabel}>{t('totalListings')}</p>
              <p className={shell.statValue}>{formatDashboardInteger(data.totalListings, lang)}</p>
            </article>
            <article
              className={`${shell.statCard} ${data.pendingListings > 0 ? shell.statCardHighlight : ''}`}
            >
              <p className={shell.statLabel}>{t('pendingListings')}</p>
              <p className={shell.statValue}>
                {formatDashboardInteger(data.pendingListings, lang)}
              </p>
            </article>
            <article className={shell.statCard}>
              <p className={shell.statLabel}>{t('totalReviews')}</p>
              <p className={shell.statValue}>{formatDashboardInteger(data.totalReviews, lang)}</p>
            </article>
            <article
              className={`${shell.statCard} ${data.pendingReviews > 0 ? shell.statCardHighlight : ''}`}
            >
              <p className={shell.statLabel}>{t('pendingReviewsModeration')}</p>
              <p className={shell.statValue}>
                {formatDashboardInteger(data.pendingReviews, lang)}
              </p>
            </article>
            <article className={shell.statCard}>
              <p className={shell.statLabel}>{t('newUsersToday')}</p>
              <p className={shell.statValue}>
                {formatDashboardInteger(data.newUsersToday, lang)}
              </p>
            </article>
            <article className={shell.statCard}>
              <p className={shell.statLabel}>{t('newListingsToday')}</p>
              <p className={shell.statValue}>
                {formatDashboardInteger(data.newListingsToday, lang)}
              </p>
            </article>
            <article
              className={`${shell.statCard} ${data.actionRequiredCount > 0 ? shell.statCardHighlight : ''}`}
            >
              <p className={shell.statLabel}>{t('actionRequired')}</p>
              <p className={shell.statValue}>
                {formatDashboardInteger(data.actionRequiredCount, lang)}
              </p>
            </article>
          </div>

          <h2 className={shell.sectionTitleSpaced}>{t('pendingListingsPreview')}</h2>
          <div className={`${shell.card} ${shell.tableCard}`}>
            <div className={shell.tableWrap}>
              <table className={shell.table} data-testid="admin-pending-table">
                <thead>
                  <tr>
                    <th scope="col">{t('colListingName')}</th>
                    <th scope="col">{t('colOwnerEmail')}</th>
                    <th scope="col">{t('colStatus')}</th>
                    <th scope="col">{t('colSubmitted')}</th>
                    <th scope="col">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pendingListingRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={shell.emptyCell}>
                        {tCommon('noResults')}
                      </td>
                    </tr>
                  ) : (
                    data.pendingListingRows.map((row) => (
                      <tr key={row._id} data-testid={`admin-pending-row-${row._id}`}>
                        <td>
                          <Link className={shell.tableLink} to={`/listings/${row.slug}`}>
                            {row.name[lang]}
                          </Link>
                        </td>
                        <td>{row.ownerEmail}</td>
                        <td>
                          <AdminStatusBadge status={row.status} kind="listing" />
                        </td>
                        <td>
                          {new Date(row.createdAt).toLocaleString(lang === 'en' ? 'en' : 'ar-SA')}
                        </td>
                        <td>
                          <div className={shell.actionGroup}>
                            <button
                              type="button"
                              className={`${shell.btn} ${shell.btnSuccess} ${shell.btnSmall}`}
                              disabled={statusBusy}
                              data-testid={`admin-approve-${row._id}`}
                              onClick={() => approveMutation.mutate(row._id)}
                            >
                              {t('approveListing')}
                            </button>
                            <button
                              type="button"
                              className={`${shell.btn} ${shell.btnDanger} ${shell.btnSmall}`}
                              disabled={statusBusy}
                              data-testid={`admin-reject-${row._id}`}
                              onClick={() => openReject(row)}
                            >
                              {t('rejectListing')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <section className={shell.card} data-testid="admin-rejection-demo">
            <h2 className={shell.sectionTitle}>{t('rejectionSectionTitle')}</h2>
            <p className={shell.hint}>{t('rejectionReasonHint')}</p>
            <div className={shell.field}>
              <label className={shell.label} htmlFor="admin-rejection-ar">
                {t('rejectionReasonAr')}
              </label>
              <textarea
                id="admin-rejection-ar"
                className={shell.textarea}
                value={rejectionAr}
                onChange={(e) => setRejectionAr(e.target.value)}
                dir="rtl"
                lang="ar"
              />
            </div>
            <div className={shell.field}>
              <label className={shell.label} htmlFor="admin-rejection-en">
                {t('rejectionReasonEn')}
              </label>
              <textarea
                id="admin-rejection-en"
                className={shell.textarea}
                value={rejectionEn}
                onChange={(e) => setRejectionEn(e.target.value)}
                dir="ltr"
                lang="en"
              />
            </div>
          </section>
        </>
      ) : null}

      {rejectTarget ? (
        <div
          className={shell.modalRoot}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-reject-dialog-title"
          data-testid="admin-reject-modal"
          onClick={closeReject}
        >
          <div className={shell.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 id="admin-reject-dialog-title" className={shell.modalTitle}>
              {t('rejectListing')}
            </h2>
            <p className={shell.modalSub}>{rejectTarget.name[lang]}</p>
            <p className={shell.hint}>{t('rejectionReasonHint')}</p>
            <div className={shell.field}>
              <label className={shell.label} htmlFor="admin-modal-rejection-ar">
                {t('rejectionReasonAr')}
              </label>
              <textarea
                id="admin-modal-rejection-ar"
                className={shell.textarea}
                value={modalAr}
                onChange={(e) => setModalAr(e.target.value)}
                dir="rtl"
                lang="ar"
                data-testid="admin-modal-rejection-ar"
              />
            </div>
            <div className={shell.field}>
              <label className={shell.label} htmlFor="admin-modal-rejection-en">
                {t('rejectionReasonEn')}
              </label>
              <textarea
                id="admin-modal-rejection-en"
                className={shell.textarea}
                value={modalEn}
                onChange={(e) => setModalEn(e.target.value)}
                dir="ltr"
                lang="en"
                data-testid="admin-modal-rejection-en"
              />
            </div>
            {rejectMutation.error instanceof ListingsApiError ? (
              <p className={shell.error} role="alert">
                {getApiErrorMessage(rejectMutation.error, tErrors)}
              </p>
            ) : null}
            <div className={shell.modalActions}>
              <button
                type="button"
                className={`${shell.btn} ${shell.btnSecondary}`}
                onClick={closeReject}
              >
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                className={shell.btn}
                disabled={
                  rejectMutation.isPending || !modalAr.trim() || !modalEn.trim()
                }
                data-testid="admin-reject-submit"
                onClick={() =>
                  rejectMutation.mutate({
                    listingId: rejectTarget._id,
                    rejectionReason: { ar: modalAr.trim(), en: modalEn.trim() },
                  })
                }
              >
                {t('confirmRejectListing')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
