import { useTranslation } from 'react-i18next';

import shell from '../adminShell.module.css';

export function AdminLoadingBlock() {
  const { t } = useTranslation('common');
  return <div className={shell.loadingBlock}>{t('loading')}</div>;
}
