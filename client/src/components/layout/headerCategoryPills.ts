export type CategoryPill = {
  slug: string;
  labelKey:
    | 'navCatGyms'
    | 'navCatPadel'
    | 'navCatBoxing'
    | 'navCatSwimming'
    | 'navCatActivities'
    | 'navCatRestaurants'
    | 'navCatTraining'
    | 'navCatRehabilitation';
};

export const CATEGORY_PILLS: CategoryPill[] = [
  { slug: 'gyms', labelKey: 'navCatGyms' },
  { slug: 'padel', labelKey: 'navCatPadel' },
  { slug: 'boxing', labelKey: 'navCatBoxing' },
  { slug: 'swimming', labelKey: 'navCatSwimming' },
  { slug: 'activities', labelKey: 'navCatActivities' },
  { slug: 'restaurants', labelKey: 'navCatRestaurants' },
  { slug: 'personal-training', labelKey: 'navCatTraining' },
  { slug: 'rehabilitation', labelKey: 'navCatRehabilitation' },
];
