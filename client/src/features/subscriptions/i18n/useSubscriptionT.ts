import { useTranslation } from 'react-i18next';

import { useLanguage } from '../../../hooks/useLanguage';
import { subscriptionDefault, subscriptionFallbacks } from './subscriptionFallbacks';

export type SubscriptionKey = keyof (typeof subscriptionFallbacks)['en'];

export function useSubscriptionT() {
  const { t: raw } = useTranslation('subscriptions');
  const { currentLang } = useLanguage();
  const lang = currentLang === 'en' ? 'en' : 'ar';

  const t = (key: SubscriptionKey) =>
    raw(key, { defaultValue: subscriptionDefault(key, lang) });

  return { t, lang };
}
