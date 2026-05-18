import { Category } from '../modules/categories/category.model.js';
import { CATEGORY_COVER_BY_SLUG } from './seedMedia.js';

const CATEGORY_ROWS: Array<{
  name: { ar: string; en: string };
  slug: string;
}> = [
  {
    name: { ar: 'الأندية الرياضية والصالات', en: 'Gyms & Fitness Centers' },
    slug: 'gyms',
  },
  { name: { ar: 'ملاعب البادل', en: 'Padel Courts' }, slug: 'padel' },
  {
    name: { ar: 'الملاكمة والفنون القتالية', en: 'Boxing & Martial Arts' },
    slug: 'boxing',
  },
  { name: { ar: 'حمامات السباحة', en: 'Swimming Pools' }, slug: 'swimming' },
  {
    name: { ar: 'الأنشطة الرياضية', en: 'Sports Activities' },
    slug: 'activities',
  },
  {
    name: { ar: 'المطاعم الصحية', en: 'Healthy Restaurants' },
    slug: 'restaurants',
  },
  {
    name: { ar: 'التدريب الشخصي', en: 'Personal Training' },
    slug: 'personal-training',
  },
  {
    name: { ar: 'إعادة التأهيل الرياضي', en: 'Sports Rehabilitation' },
    slug: 'rehabilitation',
  },
];

/**
 * Upserts the canonical Growth World categories by slug (idempotent).
 */
export async function seedCategories(): Promise<void> {
  for (let i = 0; i < CATEGORY_ROWS.length; i += 1) {
    const row = CATEGORY_ROWS[i]!;
    await Category.findOneAndUpdate(
      { slug: row.slug },
      {
        $set: {
          name: row.name,
          slug: row.slug,
          isActive: true,
          order: i,
          listingCount: 0,
          image: CATEGORY_COVER_BY_SLUG[row.slug],
        },
      },
      { upsert: true, new: true },
    );
  }
}
