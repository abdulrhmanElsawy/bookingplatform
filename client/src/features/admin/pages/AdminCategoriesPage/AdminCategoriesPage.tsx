import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '../../../../hooks/useLanguage';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  patchAdminCategory,
} from '../../api/adminApi';
import { AdminLoadingBlock } from '../../components/AdminLoadingBlock/AdminLoadingBlock';
import { AdminPageHeader } from '../../components/AdminPageHeader/AdminPageHeader';
import { AdminStatusBadge } from '../../components/AdminStatusBadge/AdminStatusBadge';
import shell from '../../components/adminShell.module.css';

export function AdminCategoriesPage() {
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const lang = useLanguage().currentLang === 'en' ? 'en' : 'ar';
  const queryClient = useQueryClient();

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');

  const { data: categories = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: fetchAdminCategories,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] });

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminCategory({
        name: { ar: nameAr.trim(), en: nameEn.trim() },
        slug: slug.trim().toLowerCase(),
        isActive: true,
      }),
    onSuccess: () => {
      setNameAr('');
      setNameEn('');
      setSlug('');
      invalidate();
    },
  });

  const patchMutation = useMutation({
    mutationFn: (args: { id: string; isActive: boolean }) =>
      patchAdminCategory(args.id, { isActive: args.isActive }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: invalidate,
  });

  return (
    <div data-testid="admin-categories-page">
      <AdminPageHeader title={t('categories')} subtitle={t('categoriesSubtitle')} />
      <div className={shell.card}>
        <h2 className={shell.sectionTitle}>{t('createCategory')}</h2>
        <div className={shell.toolbar}>
          <div className={shell.field}>
            <label className={shell.label}>{t('nameAr')}</label>
            <input className={shell.input} value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
          </div>
          <div className={shell.field}>
            <label className={shell.label}>{t('nameEn')}</label>
            <input className={shell.input} value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
          </div>
          <div className={shell.field}>
            <label className={shell.label}>{t('slug')}</label>
            <input className={shell.input} value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" />
          </div>
          <button
            type="button"
            className={shell.btn}
            disabled={
              createMutation.isPending || !nameAr.trim() || !nameEn.trim() || !slug.trim()
            }
            onClick={() => createMutation.mutate()}
          >
            {tCommon('save')}
          </button>
        </div>
        {createMutation.isError ? (
          <p className={shell.error}>{getApiErrorMessage(createMutation.error, tErrors)}</p>
        ) : null}
      </div>

      <div className={`${shell.card} ${shell.tableCard}`}>
        <h2 className={shell.sectionTitle}>{t('categoriesListTitle')}</h2>
        {isLoading ? <AdminLoadingBlock /> : null}
        {isError ? <p className={shell.error}>{getApiErrorMessage(error, tErrors)}</p> : null}
        <div className={shell.tableWrap}>
          <table className={shell.table}>
            <thead>
              <tr>
                <th>{t('nameAr')}</th>
                <th>{t('slug')}</th>
                <th>{t('listingCount')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td>{c.name[lang]}</td>
                  <td>{c.slug}</td>
                  <td>{c.listingCount}</td>
                  <td>
                    <AdminStatusBadge
                      status={c.isActive ? 'active' : 'inactive'}
                      kind="user"
                    />
                  </td>
                  <td>
                    <div className={shell.actionGroup}>
                      <button
                        type="button"
                        className={`${shell.btn} ${shell.btnSecondary} ${shell.btnSmall}`}
                        onClick={() =>
                          patchMutation.mutate({ id: c._id, isActive: !c.isActive })
                        }
                      >
                        {c.isActive ? t('deactivate') : t('activate')}
                      </button>
                      <button
                        type="button"
                        className={`${shell.btn} ${shell.btnDanger} ${shell.btnSmall}`}
                        disabled={c.listingCount > 0 || deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(t('confirmDeleteCategory'))) {
                            deleteMutation.mutate(c._id);
                          }
                        }}
                      >
                        {tCommon('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
