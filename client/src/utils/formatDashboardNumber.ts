/** Formats integers for dashboard stats using Arabic-Indic digits in Arabic UI. */
export function formatDashboardInteger(value: number, lang: 'ar' | 'en'): string {
  if (lang === 'ar') {
    return new Intl.NumberFormat('ar-SA', { numberingSystem: 'arab' }).format(value);
  }
  return new Intl.NumberFormat('en-US').format(value);
}

/** One decimal place for ratings (locale-aware digits in AR). */
export function formatDashboardRating(value: number, lang: 'ar' | 'en'): string {
  if (lang === 'ar') {
    return new Intl.NumberFormat('ar-SA', {
      numberingSystem: 'arab',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/** SAR amounts for pricing / simulated checkout (locale-aware digits in AR). */
export function formatSarCurrency(amount: number, lang: 'ar' | 'en'): string {
  if (lang === 'ar') {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      numberingSystem: 'arab',
    }).format(amount);
  }
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
  }).format(amount);
}
