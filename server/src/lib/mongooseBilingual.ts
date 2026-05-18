import { Schema } from 'mongoose';

/** Bilingual user-facing strings; both locales required. */
export const bilingualStringRequired = new Schema(
  {
    ar: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false },
);

/** Optional bilingual copy (SEO, rejection reasons, etc.). */
export const bilingualStringOptional = new Schema(
  {
    ar: { type: String, trim: true },
    en: { type: String, trim: true },
  },
  { _id: false },
);
