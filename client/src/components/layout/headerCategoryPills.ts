export type CategoryPill = {
  slug: string;
  labelKey:
    | 'navCatGyms'
    | 'navCatPadel'
    | 'navCatBoxing'
    | 'navCatActivities'
    | 'navCatRestaurants'
    | 'navCatTraining';
};

export const CATEGORY_PILLS: CategoryPill[] = [
  { slug: 'gyms', labelKey: 'navCatGyms' },
  { slug: 'padel', labelKey: 'navCatPadel' },
  { slug: 'boxing', labelKey: 'navCatBoxing' },
  { slug: 'activities', labelKey: 'navCatActivities' },
  { slug: 'restaurants', labelKey: 'navCatRestaurants' },
  { slug: 'personal-training', labelKey: 'navCatTraining' },
];
