import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLanguage } from '../../../../hooks/useLanguage';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { fetchAdminReviews, patchAdminReviewStatus } from '../../api/adminApi';
import { AdminLoadingBlock } from '../../components/AdminLoadingBlock/AdminLoadingBlock';
import { AdminPageHeader } from '../../components/AdminPageHeader/AdminPageHeader';
import { AdminPagination } from '../../components/AdminPagination/AdminPagination';
import { AdminStatusBadge } from '../../components/AdminStatusBadge/AdminStatusBadge';
import { SelectField } from '../../../../components/shared/SelectField';
import shell from '../../components/adminShell.module.css';

export function AdminReviewsPage() {
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const lang = useLanguage().currentLang === 'en' ? 'en' : 'ar';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['admin-reviews', page, status],
    queryFn: () => fetchAdminReviews(page, 20, status),
  });

  const mutation = useMutation({
    mutationFn: (args: { id: string; status: 'approved' | 'rejected' }) =>
      patchAdminReviewStatus(args.id, { status: args.status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div data-testid="admin-reviews-page">
      <AdminPageHeader title={t('reviews')} subtitle={t('reviewsSubtitle')} />
      <div className={`${shell.card} ${shell.tableCard}`}>
        <div className={shell.toolbar}>
          <div className={shell.field}>
            <label className={shell.label} htmlFor="admin-reviews-status">
              {t('colStatus')}
            </label>
            <SelectField
              id="admin-reviews-status"
              size="sm"
              value={status}
              onChange={(next) => {
                setStatus(next);
                setPage(1);
              }}
              options={[
                { value: 'pending', label: tCommon('pending') },
                { value: 'approved', label: t('reviewApproved') },
                { value: 'rejected', label: tCommon('rejected') },
              ]}
            />
          </div>
        </div>

        {isLoading ? <AdminLoadingBlock /> : null}
        {isError ? (
          <p className={shell.error} role="alert">
            {getApiErrorMessage(error, tErrors)}
          </p>
        ) : null}

        {data ? (
          <>
            <div className={shell.tableWrap}>
              <table className={shell.table}>
                <thead>
                  <tr>
                    <th>{t('colListingName')}</th>
                    <th>{t('colEmail')}</th>
                    <th>{t('reviewTitle')}</th>
                    <th>{t('colStatus')}</th>
                    <th>{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={shell.emptyCell}>
                        {tCommon('noResults')}
                      </td>
                    </tr>
                  ) : (
                    data.reviews.map((row) => (
                      <tr key={row._id}>
                        <td>
                          <Link className={shell.tableLink} to={`/listings/${row.listingSlug}`}>
                            {row.listingName[lang]}
                          </Link>
                        </td>
                        <td>{row.userEmail}</td>
                        <td>{row.title}</td>
                        <td>
                          <AdminStatusBadge status={row.status} kind="review" />
                        </td>
                        <td>
                          {status === 'pending' ? (
                            <div className={shell.actionGroup}>
                              <button
                                type="button"
                                className={`${shell.btn} ${shell.btnSuccess} ${shell.btnSmall}`}
                                disabled={mutation.isPending}
                                onClick={() =>
                                  mutation.mutate({ id: row._id, status: 'approved' })
                                }
                              >
                                {t('approveReview')}
                              </button>
                              <button
                                type="button"
                                className={`${shell.btn} ${shell.btnDanger} ${shell.btnSmall}`}
                                disabled={mutation.isPending}
                                onClick={() =>
                                  mutation.mutate({ id: row._id, status: 'rejected' })
                                }
                              >
                                {t('rejectReview')}
                              </button>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={page}
              totalPages={totalPages}
              disabled={isFetching}
              onPrev={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
