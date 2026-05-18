export interface BilingualField {
  ar: string;
  en: string;
}

export type AppLang = 'ar' | 'en';

/** Always falls back to Arabic when a value is missing. */
export function getLocalizedValue(field: BilingualField, lang: AppLang): string {
  const value = field[lang];
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return field.ar;
}
