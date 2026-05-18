import { z } from 'zod';

import { isMongoObjectId } from '../../lib/objectId.js';
import {
  AMENITY_KEYS,
  LISTING_STATUSES,
  PACKAGE_DURATIONS,
} from './listing.model.js';

const bilingualReq = z.object({
  ar: z.string().min(1),
  en: z.string().min(1),
});

const bilingualOpt = z.object({
  ar: z.string().optional(),
  en: z.string().optional(),
});

const amenityTuple = AMENITY_KEYS as unknown as [string, ...string[]];
const durationTuple = PACKAGE_DURATIONS as unknown as [string, ...string[]];
const statusTuple = LISTING_STATUSES as unknown as [string, ...string[]];

const geoPoint = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});

const listingLocation = z.object({
  address: bilingualReq,
  city: bilingualReq,
  district: bilingualReq,
  googleMapsUrl: z.string().url().min(1),
  coordinates: geoPoint.optional(),
});

const listingImage = z.object({
  url: z.string().min(1),
  publicId: z.string().optional(),
  isMain: z.boolean().optional(),
  order: z.number().optional(),
  alt: bilingualReq,
});

const listingVideo = z.object({
  url: z.string().min(1),
  thumbnail: z.string().optional(),
});

const listingPackage = z.object({
  name: bilingualReq,
  description: bilingualReq,
  price: z.number().nonnegative(),
  currency: z.string().min(1).optional(),
  duration: z.enum(durationTuple),
  features: z.array(bilingualReq).optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const dayHours = z
  .object({
    isOpen: z.boolean().optional(),
    open: z.string().optional(),
    close: z.string().optional(),
  })
  .optional();

const operatingHours = z
  .object({
    sunday: dayHours,
    monday: dayHours,
    tuesday: dayHours,
    wednesday: dayHours,
    thursday: dayHours,
    friday: dayHours,
    saturday: dayHours,
  })
  .optional();

const contact = z
  .object({
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
    instagram: z.string().optional(),
    snapchat: z.string().optional(),
    twitter: z.string().optional(),
  })
  .optional();

const categoryId = z
  .string()
  .refine((id) => isMongoObjectId(id), { message: 'Invalid category id' });

const slugPattern = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug');

export const CreateListingBodySchema = z.object({
  category: categoryId,
  name: bilingualReq,
  slug: slugPattern.optional(),
  description: bilingualReq,
  shortDescription: bilingualReq,
  location: listingLocation,
  images: z.array(listingImage).optional(),
  videos: z.array(listingVideo).optional(),
  virtualTourUrl: z.string().optional(),
  amenities: z.array(z.enum(amenityTuple)).optional(),
  tags: z.array(z.string().min(1)).optional(),
  languages: z.array(z.enum(['ar', 'en'])).optional(),
  packages: z.array(listingPackage).optional(),
  contact,
  operatingHours,
  is24Hours: z.boolean().optional(),
  status: z.enum(statusTuple).optional(),
  seoTitle: bilingualOpt.optional(),
  seoDescription: bilingualOpt.optional(),
  isFeatured: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export type CreateListingBody = z.infer<typeof CreateListingBodySchema>;

/** Partial update: each field, if present, must be complete (same as create). */
export const UpdateListingBodySchema = z
  .object({
    category: categoryId.optional(),
    name: bilingualReq.optional(),
    slug: slugPattern.optional(),
    description: bilingualReq.optional(),
    shortDescription: bilingualReq.optional(),
    location: listingLocation.optional(),
    images: z.array(listingImage).optional(),
    videos: z.array(listingVideo).optional(),
    virtualTourUrl: z.string().optional(),
    amenities: z.array(z.enum(amenityTuple)).optional(),
    tags: z.array(z.string().min(1)).optional(),
    languages: z.array(z.enum(['ar', 'en'])).optional(),
    packages: z.array(listingPackage).optional(),
    contact,
    operatingHours,
    is24Hours: z.boolean().optional(),
    status: z.enum(statusTuple).optional(),
    seoTitle: bilingualOpt.optional(),
    seoDescription: bilingualOpt.optional(),
    isFeatured: z.boolean().optional(),
    isPremium: z.boolean().optional(),
    isVerified: z.boolean().optional(),
  })
  .strict();

export type UpdateListingBody = z.infer<typeof UpdateListingBodySchema>;

export const PatchListingStatusBodySchema = z
  .object({
    status: z.enum(statusTuple),
    rejectionReason: bilingualOpt.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.status === 'rejected') {
      const ar = val.rejectionReason?.ar?.trim();
      const en = val.rejectionReason?.en?.trim();
      if (!ar || !en) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rejectionReason'],
          message:
            'rejectionReason.ar and rejectionReason.en are required when status is rejected',
        });
      }
    }
  });

export type PatchListingStatusBody = z.infer<typeof PatchListingStatusBodySchema>;
