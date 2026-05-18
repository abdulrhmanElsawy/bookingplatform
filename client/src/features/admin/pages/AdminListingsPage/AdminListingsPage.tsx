import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLanguage } from '../../../../hooks/useLanguage';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import {
  deleteAdminListing,
  fetchAdminListings,
  patchAdminListing,
} from '../../api/adminApi';
import { AdminListingFlags } from '../../components/AdminListingFlags/AdminListingFlags';
import { AdminLoadingBlock } from '../../components/AdminLoadingBlock/AdminLoadingBlock';
import { AdminPageHeader } from '../../components/AdminPageHeader/AdminPageHeader';
import { AdminPagination } from '../../components/AdminPagination/AdminPagination';
import { AdminStatusBadge } from '../../components/AdminStatusBadge/AdminStatusBadge';
import { SelectField } from '../../../../components/shared/SelectField';
import shell from '../../components/adminShell.module.css';

export function AdminListingsPage() {
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const lang = useLanguage().currentLang === 'en' ? 'en' : 'ar';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['admin-listings', page, status, search],
    queryFn: () =>
      fetchAdminListings({ page, limit: 20, status: status || undefined, search: search || undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-listings'] });

  const patchMutation = useMutation({
    mutationFn: (args: { id: string; body: Parameters<typeof patchAdminListing>[1] }) =>
      patchAdminListing(args.id, args.body),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminListing,
    onSuccess: invalidate,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div data-testid="admin-listings-page">
      <AdminPageHeader title={t('listings')} subtitle={t('listingsSubtitle')} />
      <div className={`${shell.card} ${shell.tableCard}`}>
        <div className={shell.toolbar}>
          <div className={shell.field}>
            <label className={shell.label} htmlFor="admin-listings-status">
              {t('colStatus')}
            </label>
            <SelectField
              id="admin-listings-status"
              size="sm"
              value={status}
              onChange={(next) => {
                setStatus(next);
                setPage(1);
              }}
              options={[
                { value: '', label: t('filterAll') },
                { value: 'pending', label: tCommon('pending') },
                { value: 'active', label: tCommon('active') },
                { value: 'rejected', label: tCommon('rejected') },
                { value: 'suspended', label: tCommon('suspended') },
                { value: 'draft', label: tCommon('draft') },
              ]}
            />
          </div>
          <div className={shell.fieldGrow}>
            <label className={shell.label} htmlFor="admin-listings-search">
              {t('searchListings')}
            </label>
            <input
              id="admin-listings-search"
              className={shell.input}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('searchPlaceholderListings')}
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
                    <th>{t('colOwnerEmail')}</th>
                    <th>{t('colStatus')}</th>
                    <th>{t('colFlags')}</th>
                    <th>{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.listings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={shell.emptyCell}>
                        {tCommon('noResults')}
                      </td>
                    </tr>
                  ) : (
                    data.listings.map((row) => (
                      <tr key={row._id}>
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
                          <AdminListingFlags
                            isFeatured={row.isFeatured}
                            isPremium={row.isPremium}
                            isVerified={row.isVerified}
                          />
                        </td>
                        <td>
                          <div className={shell.actionGroup}>
                            {row.status === 'pending' ? (
                              <button
                                type="button"
                                className={`${shell.btn} ${shell.btnSuccess} ${shell.btnSmall}`}
                                disabled={patchMutation.isPending}
                                onClick={() =>
                                  patchMutation.mutate({ id: row._id, body: { status: 'active' } })
                                }
                              >
                                {t('approveListing')}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className={`${shell.btn} ${shell.btnSecondary} ${shell.btnSmall}`}
                              disabled={patchMutation.isPending}
                              onClick={() =>
                                patchMutation.mutate({
                                  id: row._id,
                                  body: { isFeatured: !row.isFeatured },
                                })
                              }
                            >
                              {t('featureListing')}
                            </button>
                            <button
                              type="button"
                              className={`${shell.btn} ${shell.btnSecondary} ${shell.btnSmall}`}
                              disabled={patchMutation.isPending}
                              onClick={() =>
                                patchMutation.mutate({
                                  id: row._id,
                                  body: { isPremium: !row.isPremium },
                                })
                              }
                            >
                              {t('premiumToggle')}
                            </button>
                            <button
                              type="button"
                              className={`${shell.btn} ${shell.btnDanger} ${shell.btnSmall}`}
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (window.confirm(t('confirmDeleteListing'))) {
                                  deleteMutation.mutate(row._id);
                                }
                              }}
                            >
                              {tCommon('delete')}
                            </button>
                          </div>
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
