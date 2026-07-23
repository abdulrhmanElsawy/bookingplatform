import type { Types } from 'mongoose';

import { hashPassword } from '../modules/auth/crypto.js';
import { Category } from '../modules/categories/category.model.js';
import { Listing } from '../modules/listings/listing.model.js';
import { User } from '../modules/users/user.model.js';
import { buildListingImages, SEED_IMAGES } from './seedMedia.js';

/** Documented dev login (change in production). */
export const SEED_DEV_PASSWORD = 'DevPassword123!';

const AR_PREFS = {
  language: 'ar' as const,
  currency: 'SAR',
  notifications: { email: true, inApp: true },
};

const riyadh = {
  type: 'Point' as const,
  coordinates: [46.6753, 24.7136] as [number, number],
};

const northRiyadh = {
  type: 'Point' as const,
  coordinates: [46.7027, 24.7743] as [number, number],
};

const jeddahCoords = {
  type: 'Point' as const,
  coordinates: [39.1925, 21.4858] as [number, number],
};

async function upsertDevUser(args: {
  email: string;
  firstName: string;
  lastName: string;
  role: 'gym_owner' | 'admin' | 'user';
}): Promise<{ id: string }> {
  const password = await hashPassword(SEED_DEV_PASSWORD);
  const user = await User.findOneAndUpdate(
    { email: args.email },
    {
      $set: {
        password,
        firstName: args.firstName,
        lastName: args.lastName,
        role: args.role,
        isEmailVerified: true,
        isActive: true,
        preferences: AR_PREFS,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
  if (!user?._id) {
    throw new Error(`Failed to upsert dev user ${args.email}`);
  }
  return { id: String(user._id) };
}

/**
 * Idempotent demo users (Arabic UI default). Run after categories if you need listings.
 */
export async function seedDevUsers(): Promise<{
  ownerId: string;
  adminId: string;
  memberId: string;
  reviewerIds: string[];
}> {
  const owner = await upsertDevUser({
    email: 'owner@growth-world.local',
    firstName: 'مالك',
    lastName: 'الصالة',
    role: 'gym_owner',
  });
  const admin = await upsertDevUser({
    email: 'admin@growth-world.local',
    firstName: 'مسؤول',
    lastName: 'النظام',
    role: 'admin',
  });
  const member = await upsertDevUser({
    email: 'member@growth-world.local',
    firstName: 'عضو',
    lastName: 'تجريبي',
    role: 'user',
  });
  const reviewers = await Promise.all([
    upsertDevUser({
      email: 'reviewer1@growth-world.local',
      firstName: 'سارة',
      lastName: 'العتيبي',
      role: 'user',
    }),
    upsertDevUser({
      email: 'reviewer2@growth-world.local',
      firstName: 'محمد',
      lastName: 'القحطاني',
      role: 'user',
    }),
    upsertDevUser({
      email: 'reviewer3@growth-world.local',
      firstName: 'نورة',
      lastName: 'الشمري',
      role: 'user',
    }),
  ]);
  return {
    ownerId: owner.id,
    adminId: admin.id,
    memberId: member.id,
    reviewerIds: reviewers.map((r) => r.id),
  };
}

type ListingSeed = {
  slug: string;
  categorySlug: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  shortDescription: { ar: string; en: string };
  location: {
    address: { ar: string; en: string };
    city: { ar: string; en: string };
    district: { ar: string; en: string };
    coordinates: { type: 'Point'; coordinates: [number, number] };
    googleMapsUrl?: string;
  };
  imageUrls: string[];
  amenities: string[];
  tags: string[];
  packages: Array<{
    name: { ar: string; en: string };
    description: { ar: string; en: string };
    price: number;
    currency: string;
    duration: string;
    features: Array<{ ar: string; en: string }>;
    isPopular: boolean;
    isActive: boolean;
  }>;
  contact: { phone: string; whatsapp: string };
  isVerified: boolean;
  isFeatured: boolean;
  views: number;
  clicks: number;
  contactClicks: number;
  averageRating?: number;
  totalReviews?: number;
  ratingBreakdown?: { 1: number; 2: number; 3: number; 4: number; 5: number };
};

export const LISTING_SEEDS: ListingSeed[] = [
  {
    slug: 'demo-iron-fitness-olaya',
    categorySlug: 'gyms',
    name: { ar: 'آيرون فيتنس — العليا', en: 'Iron Fitness — Olaya' },
    description: {
      ar: 'صالة رياضية مجهزة بأحدث الأجهزة، دروس جماعية، ومنطقة أثقال حرة. مناسبة لجميع المستويات.',
      en: 'A fully equipped gym with modern machines, group classes, and a free weights zone. All levels welcome.',
    },
    shortDescription: {
      ar: 'تدريب قوة وكارديو في قلب العليا.',
      en: 'Strength and cardio training in the heart of Olaya.',
    },
    location: {
      address: { ar: 'طريق الملك فهد، العليا', en: 'King Fahd Rd, Olaya' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'العليا', en: 'Olaya' },
      coordinates: riyadh,
      googleMapsUrl: 'https://maps.google.com/?q=24.7136,46.6753',
    },
    imageUrls: [SEED_IMAGES.gym, SEED_IMAGES.gymAlt, SEED_IMAGES.gymAlt2],
    amenities: ['wifi', 'parking', 'locker', 'shower', 'personal_trainer', 'group_classes'],
    tags: ['demo', 'gym'],
    packages: [
      {
        name: { ar: 'اشتراك شهري', en: 'Monthly pass' },
        description: { ar: 'دخول غير محدود لمدة شهر.', en: 'Unlimited access for one month.' },
        price: 399,
        currency: 'SAR',
        duration: 'month',
        features: [
          { ar: 'جميع المناطق', en: 'All floor access' },
          { ar: 'درس تجريبي', en: 'Trial class' },
        ],
        isPopular: true,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000001', whatsapp: '966500000001' },
    isVerified: true,
    isFeatured: true,
    views: 120,
    clicks: 15,
    contactClicks: 4,
    averageRating: 4.6,
    totalReviews: 3,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 2 },
  },
  {
    slug: 'demo-powerhouse-gym-north',
    categorySlug: 'gyms',
    name: { ar: 'باورهاوس جيم — الشمال', en: 'Powerhouse Gym — North' },
    description: {
      ar: 'صالة واسعة بمنطقة النرجس، أجهزة كارديو حديثة، وقسم تدريب وظيفي.',
      en: 'Spacious gym in Al Narjis with modern cardio machines and a functional training zone.',
    },
    shortDescription: {
      ar: 'تدريب وظيفي وكارديو في شمال الرياض.',
      en: 'Functional training and cardio in North Riyadh.',
    },
    location: {
      address: { ar: 'حي النرجس', en: 'Al Narjis district' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'النرجس', en: 'Al Narjis' },
      coordinates: northRiyadh,
    },
    imageUrls: [SEED_IMAGES.gym, SEED_IMAGES.gymAlt, SEED_IMAGES.gymAlt2],
    amenities: ['wifi', 'parking', 'locker', 'shower', 'group_classes', 'ac'],
    tags: ['demo', 'gym'],
    packages: [
      {
        name: { ar: 'اشتراك ربع سنوي', en: 'Quarterly pass' },
        description: { ar: 'دخول غير محدود لمدة 3 أشهر.', en: 'Unlimited access for 3 months.' },
        price: 999,
        currency: 'SAR',
        duration: 'quarter',
        features: [
          { ar: 'حصة جماعية أسبوعية', en: 'Weekly group class' },
          { ar: 'تقييم لياقة', en: 'Fitness assessment' },
        ],
        isPopular: true,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000011', whatsapp: '966500000011' },
    isVerified: true,
    isFeatured: true,
    views: 95,
    clicks: 12,
    contactClicks: 3,
    averageRating: 4.4,
    totalReviews: 2,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 0 },
  },
  {
    slug: 'demo-vital-fit-jeddah',
    categorySlug: 'gyms',
    name: { ar: 'فايتال فيت — جدة', en: 'Vital Fit — Jeddah' },
    description: {
      ar: 'نادي لياقة في الروضة يقدم تدريب شخصي، منطقة سيدات، وبرامج إنقاص وزن.',
      en: 'Fitness club in Al Rawdah offering personal training, a women section, and weight-loss programs.',
    },
    shortDescription: {
      ar: 'لياقة وتدريب شخصي في جدة.',
      en: 'Fitness and personal training in Jeddah.',
    },
    location: {
      address: { ar: 'طريق الأمير سلطان', en: 'Prince Sultan Rd' },
      city: { ar: 'جدة', en: 'Jeddah' },
      district: { ar: 'الروضة', en: 'Al Rawdah' },
      coordinates: jeddahCoords,
    },
    imageUrls: [SEED_IMAGES.gym, SEED_IMAGES.gymAlt, SEED_IMAGES.gymAlt2],
    amenities: ['wifi', 'parking', 'locker', 'shower', 'women_section', 'personal_trainer'],
    tags: ['demo', 'gym'],
    packages: [
      {
        name: { ar: 'اشتراك شهري', en: 'Monthly pass' },
        description: { ar: 'دخول كامل لمدة شهر.', en: 'Full access for one month.' },
        price: 349,
        currency: 'SAR',
        duration: 'month',
        features: [
          { ar: 'منطقة سيدات', en: 'Women section' },
          { ar: 'استشارة تغذية', en: 'Nutrition consult' },
        ],
        isPopular: true,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000012', whatsapp: '966500000012' },
    isVerified: true,
    isFeatured: true,
    views: 78,
    clicks: 10,
    contactClicks: 2,
    averageRating: 4.8,
    totalReviews: 2,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2 },
  },
  {
    slug: 'demo-elite-strength-malqa',
    categorySlug: 'gyms',
    name: { ar: 'نادي إيليت للقوة — الملقا', en: 'Elite Strength — Al Malqa' },
    description: {
      ar: 'صالة متخصصة في رفع الأثقال والقوة، مع مدربين معتمدين وبرامج للمبتدئين.',
      en: 'Strength-focused gym with certified coaches and beginner-friendly programs.',
    },
    shortDescription: {
      ar: 'رفع أثقال وقوة في الملقا.',
      en: 'Strength and weightlifting in Al Malqa.',
    },
    location: {
      address: { ar: 'حي الملقا', en: 'Al Malqa district' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'الملقا', en: 'Al Malqa' },
      coordinates: northRiyadh,
    },
    imageUrls: [SEED_IMAGES.gym, SEED_IMAGES.gymAlt, SEED_IMAGES.gymAlt2],
    amenities: ['parking', 'locker', 'shower', 'personal_trainer', 'group_classes'],
    tags: ['demo', 'gym'],
    packages: [
      {
        name: { ar: 'اشتراك أسبوعي', en: 'Weekly pass' },
        description: { ar: 'دخول لمدة 7 أيام.', en: 'Access for 7 days.' },
        price: 149,
        currency: 'SAR',
        duration: 'week',
        features: [{ ar: 'منطقة أثقال حرة', en: 'Free weights area' }],
        isPopular: false,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000013', whatsapp: '966500000013' },
    isVerified: false,
    isFeatured: false,
    views: 44,
    clicks: 6,
    contactClicks: 1,
  },
  {
    slug: 'demo-prime-fitness-sulaymaniyah',
    categorySlug: 'gyms',
    name: { ar: 'برايم فيتنس — السليمانية', en: 'Prime Fitness — Sulaymaniyah' },
    description: {
      ar: 'صالة حديثة ببرامج لياقة يومية وتمارين قوة وكارديو بإشراف مدربين معتمدين.',
      en: 'Modern gym with daily fitness programs, strength training, and cardio under certified coaches.',
    },
    shortDescription: {
      ar: 'لياقة يومية في السليمانية.',
      en: 'Daily fitness in Sulaymaniyah.',
    },
    location: {
      address: { ar: 'حي السليمانية', en: 'Sulaymaniyah district' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'السليمانية', en: 'Sulaymaniyah' },
      coordinates: riyadh,
      googleMapsUrl: 'https://maps.google.com/?q=24.7202,46.6841',
    },
    imageUrls: [SEED_IMAGES.gym, SEED_IMAGES.gymAlt, SEED_IMAGES.gymAlt2],
    amenities: ['wifi', 'parking', 'locker', 'shower', 'group_classes', 'ac'],
    tags: ['demo', 'gym'],
    packages: [
      {
        name: { ar: 'اشتراك شهري', en: 'Monthly pass' },
        description: { ar: 'دخول مفتوح لمدة شهر.', en: 'Unlimited access for one month.' },
        price: 379,
        currency: 'SAR',
        duration: 'month',
        features: [
          { ar: 'تقييم لياقة مجاني', en: 'Free fitness assessment' },
          { ar: 'حصتان جماعيتان أسبوعيا', en: 'Two group classes weekly' },
        ],
        isPopular: true,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000021', whatsapp: '966500000021' },
    isVerified: true,
    isFeatured: false,
    views: 88,
    clicks: 11,
    contactClicks: 3,
    averageRating: 4.5,
    totalReviews: 4,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 2 },
  },
  {
    slug: 'demo-flex-zone-qurtubah',
    categorySlug: 'gyms',
    name: { ar: 'فليكس زون — قرطبة', en: 'Flex Zone — Qurtubah' },
    description: {
      ar: 'مركز تدريب متكامل مع مساحات كارديو واسعة وحصص عالية الكثافة.',
      en: 'Complete training center with large cardio spaces and high-intensity classes.',
    },
    shortDescription: {
      ar: 'حصص HIIT وكارديو في قرطبة.',
      en: 'HIIT and cardio in Qurtubah.',
    },
    location: {
      address: { ar: 'حي قرطبة', en: 'Qurtubah district' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'قرطبة', en: 'Qurtubah' },
      coordinates: northRiyadh,
    },
    imageUrls: [SEED_IMAGES.gym, SEED_IMAGES.gymAlt, SEED_IMAGES.gymAlt2],
    amenities: ['wifi', 'parking', 'locker', 'shower', 'group_classes', 'women_section'],
    tags: ['demo', 'gym'],
    packages: [
      {
        name: { ar: 'اشتراك ربع سنوي', en: 'Quarterly pass' },
        description: { ar: 'مرونة كاملة لمدة 3 أشهر.', en: 'Full flexibility for 3 months.' },
        price: 949,
        currency: 'SAR',
        duration: 'quarter',
        features: [
          { ar: 'حصص HIIT غير محدودة', en: 'Unlimited HIIT classes' },
          { ar: 'برنامج متابعة', en: 'Progress tracking plan' },
        ],
        isPopular: true,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000022', whatsapp: '966500000022' },
    isVerified: true,
    isFeatured: true,
    views: 102,
    clicks: 17,
    contactClicks: 5,
    averageRating: 4.7,
    totalReviews: 5,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 3 },
  },
  {
    slug: 'demo-core-athletics-jeddah',
    categorySlug: 'gyms',
    name: { ar: 'كور أثليتكس — جدة', en: 'Core Athletics — Jeddah' },
    description: {
      ar: 'مرافق متقدمة لتدريبات القوة والتحمل مع برامج متنوعة للرجال والسيدات.',
      en: 'Advanced strength and endurance facilities with diverse programs for men and women.',
    },
    shortDescription: {
      ar: 'قوة وتحمل في جدة.',
      en: 'Strength and endurance in Jeddah.',
    },
    location: {
      address: { ar: 'حي الزهراء', en: 'Al Zahra district' },
      city: { ar: 'جدة', en: 'Jeddah' },
      district: { ar: 'الزهراء', en: 'Al Zahra' },
      coordinates: jeddahCoords,
      googleMapsUrl: 'https://maps.google.com/?q=21.5231,39.1817',
    },
    imageUrls: [SEED_IMAGES.gym, SEED_IMAGES.gymAlt, SEED_IMAGES.gymAlt2],
    amenities: ['wifi', 'parking', 'locker', 'shower', 'personal_trainer', 'nutrition_coaching'],
    tags: ['demo', 'gym'],
    packages: [
      {
        name: { ar: 'اشتراك شهري مميز', en: 'Premium monthly pass' },
        description: { ar: 'اشتراك شامل مع تدريب شخصي.', en: 'All-inclusive pass with personal coaching.' },
        price: 459,
        currency: 'SAR',
        duration: 'month',
        features: [
          { ar: 'جلستان تدريب شخصي شهريا', en: 'Two PT sessions monthly' },
          { ar: 'تقييم تركيبة الجسم', en: 'Body composition check' },
        ],
        isPopular: true,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000023', whatsapp: '966500000023' },
    isVerified: true,
    isFeatured: false,
    views: 74,
    clicks: 9,
    contactClicks: 2,
    averageRating: 4.3,
    totalReviews: 3,
    ratingBreakdown: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 },
  },
  {
    slug: 'demo-urban-gym-hittin',
    categorySlug: 'gyms',
    name: { ar: 'أوربن جيم — حطين', en: 'Urban Gym — Hittin' },
    description: {
      ar: 'نادي عصري مع أجهزة حديثة، مساحات تدريب حرة، وبرامج لياقة مرنة.',
      en: 'Contemporary gym with modern equipment, free training zones, and flexible fitness plans.',
    },
    shortDescription: {
      ar: 'نادي عصري في حطين.',
      en: 'Modern gym in Hittin.',
    },
    location: {
      address: { ar: 'حي حطين', en: 'Hittin district' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'حطين', en: 'Hittin' },
      coordinates: northRiyadh,
    },
    imageUrls: [SEED_IMAGES.gym, SEED_IMAGES.gymAlt, SEED_IMAGES.gymAlt2],
    amenities: ['wifi', 'parking', 'locker', 'ac', 'group_classes', 'personal_trainer'],
    tags: ['demo', 'gym'],
    packages: [
      {
        name: { ar: 'اشتراك نصف سنوي', en: 'Half-year pass' },
        description: { ar: 'أفضل قيمة لمدة 6 أشهر.', en: 'Best-value plan for 6 months.' },
        price: 1699,
        currency: 'SAR',
        duration: 'quarter',
        features: [
          { ar: 'دخول غير محدود', en: 'Unlimited access' },
          { ar: 'برنامج تدريبي مخصص', en: 'Custom training plan' },
        ],
        isPopular: false,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000024', whatsapp: '966500000024' },
    isVerified: false,
    isFeatured: false,
    views: 51,
    clicks: 7,
    contactClicks: 2,
  },
  {
    slug: 'demo-titan-performance-yasmeen',
    categorySlug: 'gyms',
    name: { ar: 'تايتن بيرفورمنس — الياسمين', en: 'Titan Performance — Yasmeen' },
    description: {
      ar: 'مركز أداء رياضي للتمارين المتقدمة وبرامج التحمل والقوة.',
      en: 'Athletic performance center for advanced training, endurance, and strength programs.',
    },
    shortDescription: {
      ar: 'مركز أداء رياضي في الياسمين.',
      en: 'Performance center in Yasmeen.',
    },
    location: {
      address: { ar: 'حي الياسمين', en: 'Al Yasmeen district' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'الياسمين', en: 'Al Yasmeen' },
      coordinates: northRiyadh,
      googleMapsUrl: 'https://maps.google.com/?q=24.8134,46.6531',
    },
    imageUrls: [SEED_IMAGES.gym, SEED_IMAGES.gymAlt, SEED_IMAGES.gymAlt2],
    amenities: ['wifi', 'parking', 'locker', 'shower', 'sauna', 'group_classes'],
    tags: ['demo', 'gym'],
    packages: [
      {
        name: { ar: 'اشتراك شهري', en: 'Monthly pass' },
        description: { ar: 'باقة أداء متكاملة.', en: 'Complete performance package.' },
        price: 419,
        currency: 'SAR',
        duration: 'month',
        features: [
          { ar: 'تقييم أداء', en: 'Performance assessment' },
          { ar: 'حصة تعافي', en: 'Recovery session' },
        ],
        isPopular: true,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000025', whatsapp: '966500000025' },
    isVerified: true,
    isFeatured: true,
    views: 110,
    clicks: 16,
    contactClicks: 4,
    averageRating: 4.6,
    totalReviews: 4,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 2 },
  },
  {
    slug: 'demo-fit-hub-hamra',
    categorySlug: 'gyms',
    name: { ar: 'فيت هب — الحمراء', en: 'Fit Hub — Al Hamra' },
    description: {
      ar: 'نادي محلي مناسب للعائلات مع تمارين يومية ومرافق نظيفة.',
      en: 'Neighborhood family-friendly gym with daily classes and clean facilities.',
    },
    shortDescription: {
      ar: 'نادي عائلي في الحمراء.',
      en: 'Family-friendly gym in Al Hamra.',
    },
    location: {
      address: { ar: 'حي الحمراء', en: 'Al Hamra district' },
      city: { ar: 'جدة', en: 'Jeddah' },
      district: { ar: 'الحمراء', en: 'Al Hamra' },
      coordinates: jeddahCoords,
    },
    imageUrls: [SEED_IMAGES.gym, SEED_IMAGES.gymAlt, SEED_IMAGES.gymAlt2],
    amenities: ['wifi', 'parking', 'locker', 'shower', 'family_section', 'group_classes'],
    tags: ['demo', 'gym'],
    packages: [
      {
        name: { ar: 'اشتراك أسبوعي', en: 'Weekly pass' },
        description: { ar: 'مرن وسريع لمدة 7 أيام.', en: 'Flexible short-term access for 7 days.' },
        price: 129,
        currency: 'SAR',
        duration: 'week',
        features: [
          { ar: 'حصة جماعية واحدة', en: 'One group class' },
          { ar: 'دخول في أوقات الذروة', en: 'Peak-time access' },
        ],
        isPopular: false,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000026', whatsapp: '966500000026' },
    isVerified: false,
    isFeatured: false,
    views: 38,
    clicks: 5,
    contactClicks: 1,
  },
];

/** Legacy demo listings removed from the gym-only launch. */
export const REMOVED_DEMO_LISTING_SLUGS = [
  'demo-padel-north-arena',
  'demo-champions-boxing',
  'demo-aqua-blue-pool',
  'demo-outdoor-activities-hub',
  'demo-fit-kitchen',
  'demo-elite-pt-studio',
  'demo-recovery-center',
] as const;


/**
 * Idempotent demo listings (bilingual fields). Requires categories + gym_owner user.
 */
export async function seedDevListings(ownerId: string): Promise<void> {
  const categories = await Category.find({ slug: { $in: LISTING_SEEDS.map((l) => l.categorySlug) } })
    .lean<{ _id: Types.ObjectId; slug: string }[]>()
    .exec();
  const categoryBySlug = new Map(categories.map((c) => [String(c.slug), c._id]));

  const publishedAt = new Date();

  for (const seed of LISTING_SEEDS) {
    const categoryId = categoryBySlug.get(seed.categorySlug);
    if (!categoryId) {
      throw new Error(`Category missing for slug: ${seed.categorySlug}`);
    }

    const images = buildListingImages(seed.imageUrls, seed.name);
    const { averageRating, totalReviews, ratingBreakdown, ...rest } = seed;

    await Listing.findOneAndUpdate(
      { slug: seed.slug },
      {
        $set: {
          owner: ownerId,
          category: categoryId,
          name: rest.name,
          slug: rest.slug,
          description: rest.description,
          shortDescription: rest.shortDescription,
          location: rest.location,
          images,
          amenities: rest.amenities,
          languages: ['ar', 'en'],
          tags: rest.tags,
          packages: rest.packages,
          contact: rest.contact,
          status: 'active',
          isVerified: rest.isVerified,
          isFeatured: rest.isFeatured,
          publishedAt,
          views: rest.views,
          clicks: rest.clicks,
          contactClicks: rest.contactClicks,
          ...(averageRating != null ? { averageRating } : {}),
          ...(totalReviews != null ? { totalReviews } : {}),
          ...(ratingBreakdown != null ? { ratingBreakdown } : {}),
        },
      },
      { upsert: true, new: true },
    ).exec();
  }

  if (REMOVED_DEMO_LISTING_SLUGS.length > 0) {
    await Listing.updateMany(
      { slug: { $in: [...REMOVED_DEMO_LISTING_SLUGS] } },
      { $set: { status: 'suspended' } },
    ).exec();
  }
}
