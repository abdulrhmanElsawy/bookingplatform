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
    slug: 'demo-padel-north-arena',
    categorySlug: 'padel',
    name: { ar: 'أرينا بادل — الشمال', en: 'Padel North Arena' },
    description: {
      ar: 'ملاعب بادل احترافية مع إضاءة ليلية، مناسبة للفرق والأفراد. حجز أونلاين.',
      en: 'Professional padel courts with night lighting for teams and individuals. Online booking.',
    },
    shortDescription: { ar: 'ملاعب بادل في شمال الرياض.', en: 'Padel courts in North Riyadh.' },
    location: {
      address: { ar: 'حي النرجس', en: 'Al Narjis district' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'النرجس', en: 'Al Narjis' },
      coordinates: northRiyadh,
    },
    imageUrls: [SEED_IMAGES.padel, SEED_IMAGES.padelAlt],
    amenities: ['parking', 'cafe', 'ac'],
    tags: ['demo', 'padel'],
    packages: [
      {
        name: { ar: 'ساعة لعب', en: 'Court hour' },
        description: { ar: 'حجز ملعب لمدة ساعة.', en: 'One-hour court booking.' },
        price: 180,
        currency: 'SAR',
        duration: 'day',
        features: [{ ar: 'مضارب للإيجار', en: 'Racket rental' }],
        isPopular: false,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000002', whatsapp: '966500000002' },
    isVerified: true,
    isFeatured: false,
    views: 64,
    clicks: 9,
    contactClicks: 2,
    averageRating: 4.2,
    totalReviews: 1,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 },
  },
  {
    slug: 'demo-champions-boxing',
    categorySlug: 'boxing',
    name: { ar: 'تشامبيونز بوكسينغ', en: 'Champions Boxing Club' },
    description: {
      ar: 'نادي ملاكمة مع مدربين معتمدين، حلقات تدريب للمبتدئين والمحترفين.',
      en: 'Boxing club with certified coaches and classes for beginners and pros.',
    },
    shortDescription: { ar: 'ملاكمة وفنون قتالية في الرياض.', en: 'Boxing and martial arts in Riyadh.' },
    location: {
      address: { ar: 'حي الملقا', en: 'Al Malqa district' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'الملقا', en: 'Al Malqa' },
      coordinates: northRiyadh,
    },
    imageUrls: [SEED_IMAGES.boxing],
    amenities: ['parking', 'locker', 'shower', 'personal_trainer'],
    tags: ['demo', 'boxing'],
    packages: [
      {
        name: { ar: 'حصة تجريبية', en: 'Trial session' },
        description: { ar: 'حصة واحدة مع مدرب.', en: 'One coached session.' },
        price: 99,
        currency: 'SAR',
        duration: 'day',
        features: [{ ar: 'قفازات متوفرة', en: 'Gloves provided' }],
        isPopular: true,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000003', whatsapp: '966500000003' },
    isVerified: true,
    isFeatured: true,
    views: 88,
    clicks: 11,
    contactClicks: 3,
  },
  {
    slug: 'demo-aqua-blue-pool',
    categorySlug: 'swimming',
    name: { ar: 'أكوا بلو للسباحة', en: 'Aqua Blue Swim Center' },
    description: {
      ar: 'مسبح أولمبي مدفأ مع دروس سباحة للأطفال والكبار.',
      en: 'Heated Olympic pool with swim lessons for kids and adults.',
    },
    shortDescription: { ar: 'سباحة ودروس مائية.', en: 'Swimming and aquatics lessons.' },
    location: {
      address: { ar: 'طريق الأمير سلطان', en: 'Prince Sultan Rd' },
      city: { ar: 'جدة', en: 'Jeddah' },
      district: { ar: 'الروضة', en: 'Al Rawdah' },
      coordinates: jeddahCoords,
    },
    imageUrls: [SEED_IMAGES.swimming],
    amenities: ['parking', 'locker', 'shower', 'pool'],
    tags: ['demo', 'swimming'],
    packages: [
      {
        name: { ar: 'دخول يومي', en: 'Day pass' },
        description: { ar: 'دخول المسبح ليوم واحد.', en: 'Pool access for one day.' },
        price: 75,
        currency: 'SAR',
        duration: 'day',
        features: [{ ar: 'خزانة مجانية', en: 'Free locker' }],
        isPopular: true,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000004', whatsapp: '966500000004' },
    isVerified: true,
    isFeatured: false,
    views: 52,
    clicks: 7,
    contactClicks: 1,
  },
  {
    slug: 'demo-outdoor-activities-hub',
    categorySlug: 'activities',
    name: { ar: 'مركز الأنشطة الخارجية', en: 'Outdoor Activities Hub' },
    description: {
      ar: 'رحلات دراجات، تسلق، وركوب خيل في ضواحي الرياض.',
      en: 'Cycling trips, climbing, and horseback riding near Riyadh.',
    },
    shortDescription: { ar: 'مغامرات ورياضات خارجية.', en: 'Adventure and outdoor sports.' },
    location: {
      address: { ar: 'وادي حنيفة', en: 'Wadi Hanifa' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'الدرعية', en: 'Diriyah' },
      coordinates: riyadh,
    },
    imageUrls: [SEED_IMAGES.activities],
    amenities: ['parking', 'cafe'],
    tags: ['demo', 'activities'],
    packages: [
      {
        name: { ar: 'جولة نصف يوم', en: 'Half-day tour' },
        description: { ar: 'جولة مرشدة لمدة 4 ساعات.', en: 'Guided 4-hour tour.' },
        price: 220,
        currency: 'SAR',
        duration: 'day',
        features: [{ ar: 'معدات مشمولة', en: 'Gear included' }],
        isPopular: true,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000005', whatsapp: '966500000005' },
    isVerified: false,
    isFeatured: true,
    views: 41,
    clicks: 5,
    contactClicks: 1,
  },
  {
    slug: 'demo-fit-kitchen',
    categorySlug: 'restaurants',
    name: { ar: 'فت كيتشن', en: 'Fit Kitchen' },
    description: {
      ar: 'مطعم صحي بوجبات عالية البروتين وخيارات نباتية.',
      en: 'Healthy restaurant with high-protein meals and vegan options.',
    },
    shortDescription: { ar: 'أكل صحي بعد التمرين.', en: 'Healthy food post-workout.' },
    location: {
      address: { ar: 'شارع التحلية', en: 'Tahlia St' },
      city: { ar: 'جدة', en: 'Jeddah' },
      district: { ar: 'الزهراء', en: 'Al Zahra' },
      coordinates: jeddahCoords,
    },
    imageUrls: [SEED_IMAGES.restaurant],
    amenities: ['wifi', 'parking', 'cafe'],
    tags: ['demo', 'restaurant'],
    packages: [
      {
        name: { ar: 'وجبة أسبوعية', en: 'Weekly meal plan' },
        description: { ar: '5 وجبات جاهزة.', en: '5 ready meals.' },
        price: 299,
        currency: 'SAR',
        duration: 'week',
        features: [{ ar: 'توصيل مجاني', en: 'Free delivery' }],
        isPopular: true,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000006', whatsapp: '966500000006' },
    isVerified: true,
    isFeatured: false,
    views: 36,
    clicks: 4,
    contactClicks: 0,
  },
  {
    slug: 'demo-elite-pt-studio',
    categorySlug: 'personal-training',
    name: { ar: 'استوديو إيليت للتدريب', en: 'Elite PT Studio' },
    description: {
      ar: 'تدريب شخصي فردي مع خطط غذائية مخصصة.',
      en: 'One-on-one personal training with custom nutrition plans.',
    },
    shortDescription: { ar: 'مدربون معتمدون على مدار الساعة.', en: 'Certified coaches on demand.' },
    location: {
      address: { ar: 'حي الياسمين', en: 'Al Yasmin district' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'الياسمين', en: 'Al Yasmin' },
      coordinates: northRiyadh,
    },
    imageUrls: [SEED_IMAGES.training],
    amenities: ['parking', 'personal_trainer', 'wifi'],
    tags: ['demo', 'pt'],
    packages: [
      {
        name: { ar: 'باقة 8 جلسات', en: '8-session pack' },
        description: { ar: 'ثماني جلسات تدريب شخصي.', en: 'Eight personal training sessions.' },
        price: 1200,
        currency: 'SAR',
        duration: 'month',
        features: [{ ar: 'تقييم لياقة', en: 'Fitness assessment' }],
        isPopular: true,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000007', whatsapp: '966500000007' },
    isVerified: true,
    isFeatured: true,
    views: 70,
    clicks: 8,
    contactClicks: 2,
    averageRating: 4.8,
    totalReviews: 1,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
  },
  {
    slug: 'demo-recovery-center',
    categorySlug: 'rehabilitation',
    name: { ar: 'مركز التعافي الرياضي', en: 'Sports Recovery Center' },
    description: {
      ar: 'علاج طبيعي، تدليك رياضي، وساونا للتعافي بعد الإصابات.',
      en: 'Physiotherapy, sports massage, and sauna for injury recovery.',
    },
    shortDescription: { ar: 'إعادة تأهيل وتعافي.', en: 'Rehab and recovery.' },
    location: {
      address: { ar: 'طريق الملك عبدالله', en: 'King Abdullah Rd' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'الصحافة', en: 'Al Sahafa' },
      coordinates: riyadh,
    },
    imageUrls: [SEED_IMAGES.rehab],
    amenities: ['parking', 'wifi', 'ac'],
    tags: ['demo', 'rehab'],
    packages: [
      {
        name: { ar: 'جلسة تعافي', en: 'Recovery session' },
        description: { ar: 'جلسة 60 دقيقة مع أخصائي.', en: '60-minute session with a specialist.' },
        price: 250,
        currency: 'SAR',
        duration: 'day',
        features: [{ ar: 'تقرير متابعة', en: 'Follow-up report' }],
        isPopular: false,
        isActive: true,
      },
    ],
    contact: { phone: '+966500000008', whatsapp: '966500000008' },
    isVerified: true,
    isFeatured: false,
    views: 29,
    clicks: 3,
    contactClicks: 1,
  },
];

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
}
