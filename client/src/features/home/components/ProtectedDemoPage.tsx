import { useTranslation } from 'react-i18next';

export function ProtectedDemoPage() {
  const { t } = useTranslation('common');
  return <p data-testid="protected-demo-ok">{t('profile')}</p>;
}
