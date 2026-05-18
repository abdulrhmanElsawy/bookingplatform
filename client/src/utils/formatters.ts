export type AppLang = 'ar' | 'en';

export function formatNumber(value: number, lang: AppLang): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(value);
}

export function formatCurrency(amount: number, lang: AppLang): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    currencyDisplay: lang === 'ar' ? 'symbol' : 'code',
  }).format(amount);
}

export function formatDate(date: Date, lang: AppLang): string {
  return new Intl.DateTimeFormat(
    lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  ).format(date);
}

const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 31536000000 },
  { unit: 'month', ms: 2628000000 },
  { unit: 'week', ms: 604800000 },
  { unit: 'day', ms: 86400000 },
  { unit: 'hour', ms: 3600000 },
  { unit: 'minute', ms: 60000 },
  { unit: 'second', ms: 1000 },
];

export function formatRelativeTime(date: Date, lang: AppLang): string {
  const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    numeric: 'auto',
  });
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);

  for (const { unit, ms } of UNITS) {
    if (absMs >= ms || unit === 'second') {
      const value = Math.round(diffMs / ms);
      return rtf.format(value, unit);
    }
  }

  return rtf.format(0, 'second');
}
