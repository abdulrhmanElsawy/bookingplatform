/** Bilingual cities for home “browse by city” links (TASK-016). */
export type HomeCity = {
  slug: string;
  ar: string;
  en: string;
  imageUrl: string;
};

export const HOME_CITIES: HomeCity[] = [
  {
    ar: 'الرياض',
    en: 'Riyadh',
    slug: 'riyadh',
    imageUrl: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&q=80',
  },
  {
    ar: 'جدة',
    en: 'Jeddah',
    slug: 'jeddah',
    imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80',
  },
  {
    ar: 'الدمام',
    en: 'Dammam',
    slug: 'dammam',
    imageUrl: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=800&q=80',
  },
  {
    ar: 'مكة المكرمة',
    en: 'Makkah',
    slug: 'makkah',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  },
  {
    ar: 'المدينة المنورة',
    en: 'Madinah',
    slug: 'madinah',
    imageUrl: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80',
  },
  {
    ar: 'الخبر',
    en: 'Khobar',
    slug: 'khobar',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  },
];
