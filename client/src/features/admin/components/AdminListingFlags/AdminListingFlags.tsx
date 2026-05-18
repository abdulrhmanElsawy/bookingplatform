import { useTranslation } from 'react-i18next';

import shell from '../adminShell.module.css';

type AdminListingFlagsProps = {
  isFeatured?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
};

export function AdminListingFlags({
  isFeatured,
  isPremium,
  isVerified,
}: AdminListingFlagsProps) {
  const { t } = useTranslation('admin');
  if (!isFeatured && !isPremium && !isVerified) return null;

  return (
    <div className={shell.flagGroup}>
      {isFeatured ? (
        <span className={`${shell.flag} ${shell.flagFeatured}`}>{t('flagFeatured')}</span>
      ) : null}
      {isPremium ? (
        <span className={`${shell.flag} ${shell.flagPremium}`}>{t('flagPremium')}</span>
      ) : null}
      {isVerified ? (
        <span className={`${shell.flag} ${shell.flagVerified}`}>{t('flagVerified')}</span>
      ) : null}
    </div>
  );
}
