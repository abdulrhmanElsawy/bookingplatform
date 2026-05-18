import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLanguage } from '../../../../hooks/useLanguage';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { fetchAdminSubscriptions, patchAdminSubscription } from '../../api/adminApi';
import { AdminLoadingBlock } from '../../components/AdminLoadingBlock/AdminLoadingBlock';
import { AdminPageHeader } from '../../components/AdminPageHeader/AdminPageHeader';
import { AdminPagination } from '../../components/AdminPagination/AdminPagination';
import { AdminStatusBadge } from '../../components/AdminStatusBadge/AdminStatusBadge';
import shell from '../../components/adminShell.module.css';

export function AdminSubscriptionsPage() {
  const { t } = useTranslation('admin');
  const { t: tErrors } = useTranslation('errors');
  const lang = useLanguage().currentLang === 'en' ? 'en' : 'ar';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['admin-subscriptions', page, search],
    queryFn: () => fetchAdminSubscriptions(page, 20, search),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => patchAdminSubscription(id, { status: 'cancelled' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div data-testid="admin-subscriptions-page">
      <AdminPageHeader
        title={t('nav.subscriptions')}
        subtitle={t('subscriptionsSubtitle')}
      />
      <div className={`${shell.card} ${shell.tableCard}`}>
        <div className={shell.toolbar}>
          <div className={shell.fieldGrow}>
            <label className={shell.label}>{t('searchSubscriptions')}</label>
            <input
              className={shell.input}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('searchPlaceholderSubscriptions')}
            />
          </div>
          <button
            type="button"
            className={shell.btn}
            onClick={() => {
              setSearch(searchInput.trim());
              setPage(1);
            }}
          >
            {t('applySearch')}
          </button>
        </div>

        {isLoading ? <AdminLoadingBlock /> : null}
        {isError ? <p className={shell.error}>{getApiErrorMessage(error, tErrors)}</p> : null}

        {data ? (
          <>
            <div className={shell.tableWrap}>
              <table className={shell.table}>
                <thead>
                  <tr>
                    <th>{t('accessCode')}</th>
                    <th>{t('colEmail')}</th>
                    <th>{t('colListingName')}</th>
                    <th>{t('colStatus')}</th>
                    <th>{t('validUntil')}</th>
                    <th>{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subscriptions.map((row) => (
                    <tr key={row._id}>
                      <td>{row.accessCode}</td>
                      <td>{row.userEmail}</td>
                      <td>
                        <Link className={shell.tableLink} to={`/listings/${row.listingSlug}`}>
                          {row.listingName[lang]}
                        </Link>
                      </td>
                      <td>
                        <AdminStatusBadge status={row.status} kind="subscription" />
                      </td>
                      <td>
                        {new Date(row.validUntil).toLocaleDateString(
                          lang === 'en' ? 'en' : 'ar-SA',
                        )}
                      </td>
                      <td>
                        {row.status === 'active' ? (
                          <button
                            type="button"
                            className={`${shell.btn} ${shell.btnDanger} ${shell.btnSmall}`}
                            disabled={cancelMutation.isPending}
                            onClick={() => {
                              if (window.confirm(t('confirmCancelSubscription'))) {
                                cancelMutation.mutate(row._id);
                              }
                            }}
                          >
                            {t('cancelSubscription')}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
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
