import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { fetchAdminSettings, patchAdminSettings } from '../../api/adminApi';
import { AdminLoadingBlock } from '../../components/AdminLoadingBlock/AdminLoadingBlock';
import { AdminPageHeader } from '../../components/AdminPageHeader/AdminPageHeader';
import { SelectField } from '../../../../components/shared/SelectField';
import shell from '../../components/adminShell.module.css';

export function AdminSettingsPage() {
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: fetchAdminSettings,
  });

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [reviewsRequireModeration, setReviewsRequireModeration] = useState(false);
  const [defaultLanguage, setDefaultLanguage] = useState<'ar' | 'en'>('ar');
  const [bannerAr, setBannerAr] = useState('');
  const [bannerEn, setBannerEn] = useState('');

  useEffect(() => {
    if (!data) return;
    setMaintenanceMode(data.maintenanceMode);
    setAllowRegistration(data.allowRegistration);
    setReviewsRequireModeration(data.reviewsRequireModeration);
    setDefaultLanguage(data.defaultLanguage);
    setBannerAr(data.announcementBanner?.ar ?? '');
    setBannerEn(data.announcementBanner?.en ?? '');
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      patchAdminSettings({
        maintenanceMode,
        allowRegistration,
        reviewsRequireModeration,
        defaultLanguage,
        announcementBanner: {
          ar: bannerAr.trim() || undefined,
          en: bannerEn.trim() || undefined,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
  });

  return (
    <div data-testid="admin-settings-page">
      <AdminPageHeader title={t('settings')} subtitle={t('settingsSubtitle')} />
      <div className={shell.card}>
        {isLoading ? <AdminLoadingBlock /> : null}
        {isError ? <p className={shell.error}>{getApiErrorMessage(error, tErrors)}</p> : null}
        {data ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <h2 className={shell.sectionTitle}>{t('settingsFormTitle')}</h2>
            <label className={shell.checkRow}>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
              />
              <span>{t('maintenanceMode')}</span>
            </label>
            <label className={shell.checkRow}>
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
              />
              <span>{t('allowRegistration')}</span>
            </label>
            <label className={shell.checkRow}>
              <input
                type="checkbox"
                checked={reviewsRequireModeration}
                onChange={(e) => setReviewsRequireModeration(e.target.checked)}
              />
              <span>{t('reviewsRequireModeration')}</span>
            </label>
            <div className={shell.field}>
              <label className={shell.label} htmlFor="admin-default-lang">
                {t('defaultLanguage')}
              </label>
              <SelectField
                id="admin-default-lang"
                size="sm"
                value={defaultLanguage}
                onChange={(next) => setDefaultLanguage(next as 'ar' | 'en')}
                options={[
                  { value: 'ar', label: t('languageAr') },
                  { value: 'en', label: t('languageEn') },
                ]}
              />
            </div>
            <div className={shell.field}>
              <label className={shell.label} htmlFor="admin-banner-ar">
                {t('announcementAr')}
              </label>
              <textarea
                id="admin-banner-ar"
                className={shell.textarea}
                value={bannerAr}
                onChange={(e) => setBannerAr(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className={shell.field}>
              <label className={shell.label} htmlFor="admin-banner-en">
                {t('announcementEn')}
              </label>
              <textarea
                id="admin-banner-en"
                className={shell.textarea}
                value={bannerEn}
                onChange={(e) => setBannerEn(e.target.value)}
                dir="ltr"
              />
            </div>
            {saveMutation.isError ? (
              <p className={shell.error}>{getApiErrorMessage(saveMutation.error, tErrors)}</p>
            ) : null}
            {saveMutation.isSuccess ? <p className={shell.success}>{t('settingsSaved')}</p> : null}
            <button type="submit" className={shell.btn} disabled={saveMutation.isPending}>
              {tCommon('save')}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
