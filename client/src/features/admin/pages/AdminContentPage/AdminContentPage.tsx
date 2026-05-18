import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLanguage } from '../../../../hooks/useLanguage';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import {
  fetchAdminHomeContent,
  fetchAdminListings,
  patchAdminListing,
} from '../../api/adminApi';
import { AdminLoadingBlock } from '../../components/AdminLoadingBlock/AdminLoadingBlock';
import { AdminPageHeader } from '../../components/AdminPageHeader/AdminPageHeader';
import shell from '../../components/adminShell.module.css';

export function AdminContentPage() {
  const { t } = useTranslation('admin');
  const { t: tErrors } = useTranslation('errors');
  const lang = useLanguage().currentLang === 'en' ? 'en' : 'ar';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const previewQuery = useQuery({
    queryKey: ['admin-home-content'],
    queryFn: fetchAdminHomeContent,
  });

  const listingsQuery = useQuery({
    queryKey: ['admin-content-listings', search],
    queryFn: () =>
      fetchAdminListings({ page: 1, limit: 50, status: 'active', search: search || undefined }),
  });

  const patchMutation = useMutation({
    mutationFn: (args: { id: string; body: Parameters<typeof patchAdminListing>[1] }) =>
      patchAdminListing(args.id, args.body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-content-listings'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-home-content'] });
    },
  });

  return (
    <div data-testid="admin-content-page">
      <AdminPageHeader title={t('nav.content')} subtitle={t('contentSubtitle')} />
      {previewQuery.data ? (
        <div className={shell.previewPanel}>
          <p className={shell.sectionTitle}>{t('contentPreviewTitle')}</p>
          <p className={shell.previewLine}>
            {t('featuredCount', { count: previewQuery.data.featured.length })}
          </p>
          <p className={shell.previewLine}>
            {t('premiumCount', { count: previewQuery.data.premium.length })}
          </p>
        </div>
      ) : null}

      <div className={`${shell.card} ${shell.tableCard}`}>
        <div className={shell.toolbar}>
          <div className={shell.fieldGrow}>
            <label className={shell.label}>{t('searchListings')}</label>
            <input
              className={shell.input}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholderListings')}
            />
          </div>
        </div>

        {listingsQuery.isLoading ? <AdminLoadingBlock /> : null}
        {listingsQuery.isError ? (
          <p className={shell.error}>{getApiErrorMessage(listingsQuery.error, tErrors)}</p>
        ) : null}

        {listingsQuery.data ? (
          <div className={shell.tableWrap}>
            <table className={shell.table}>
              <thead>
                <tr>
                  <th>{t('colListingName')}</th>
                  <th className={shell.toggleCell}>{t('featureListing')}</th>
                  <th className={shell.toggleCell}>{t('premiumToggle')}</th>
                  <th className={shell.toggleCell}>{t('verifiedToggle')}</th>
                </tr>
              </thead>
              <tbody>
                {listingsQuery.data.listings.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <Link className={shell.tableLink} to={`/listings/${row.slug}`}>
                        {row.name[lang]}
                      </Link>
                    </td>
                    <td className={shell.toggleCell}>
                      <label className={shell.toggleLabel}>
                        <input
                          type="checkbox"
                          checked={row.isFeatured}
                          disabled={patchMutation.isPending}
                          onChange={() =>
                            patchMutation.mutate({
                              id: row._id,
                              body: { isFeatured: !row.isFeatured },
                            })
                          }
                        />
                      </label>
                    </td>
                    <td className={shell.toggleCell}>
                      <label className={shell.toggleLabel}>
                        <input
                          type="checkbox"
                          checked={row.isPremium}
                          disabled={patchMutation.isPending}
                          onChange={() =>
                            patchMutation.mutate({
                              id: row._id,
                              body: { isPremium: !row.isPremium },
                            })
                          }
                        />
                      </label>
                    </td>
                    <td className={shell.toggleCell}>
                      <label className={shell.toggleLabel}>
                        <input
                          type="checkbox"
                          checked={row.isVerified}
                          disabled={patchMutation.isPending}
                          onChange={() =>
                            patchMutation.mutate({
                              id: row._id,
                              body: { isVerified: !row.isVerified },
                            })
                          }
                        />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
