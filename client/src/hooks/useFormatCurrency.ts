import { useCallback } from 'react';

import { formatCurrency } from '../utils/formatters';
import { useLanguage } from './useLanguage';

export function useFormatCurrency() {
  const { currentLang } = useLanguage();

  return useCallback((amount: number) => formatCurrency(amount, currentLang), [currentLang]);
}
