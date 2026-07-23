/** Bilingual cities for home “browse by city” links (TASK-016). */
export type HomeCity = {
  slug: string;
  ar: string;
  en: string;
  imageUrl: string;
};

export const HOME_CITIES: HomeCity[] = [
  {
    ar: 'المدينة المنورة',
    en: 'Madinah',
    slug: 'madinah',
    imageUrl: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80',
  },
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
];
