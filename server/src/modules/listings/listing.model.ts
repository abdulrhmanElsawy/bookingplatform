import mongoose, { Schema } from 'mongoose';

import {
  bilingualStringOptional,
  bilingualStringRequired,
} from '../../lib/mongooseBilingual.js';

export const PACKAGE_DURATIONS = ['day', 'week', 'month', 'quarter', 'year'] as const;
export type PackageDuration = (typeof PACKAGE_DURATIONS)[number];

export const LISTING_STATUSES = [
  'draft',
  'pending',
  'active',
  'rejected',
  'suspended',
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const AMENITY_KEYS = [
  'wifi',
  'parking',
  'locker',
  'shower',
  'cafe',
  'pool',
  'sauna',
  'ac',
  'elevator',
  'prayer_room',
  'women_section',
  'men_section',
  'family_section',
  'disabled_access',
  'towel_service',
  'personal_trainer',
  'nutrition_coaching',
  'group_classes',
] as const;
export type AmenityKey = (typeof AMENITY_KEYS)[number];

const DayHoursSchema = new Schema(
  {
    isOpen: { type: Boolean, default: false },
    open: { type: String, default: '', trim: true },
    close: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const OperatingHoursSchema = new Schema(
  {
    sunday: { type: DayHoursSchema },
    monday: { type: DayHoursSchema },
    tuesday: { type: DayHoursSchema },
    wednesday: { type: DayHoursSchema },
    thursday: { type: DayHoursSchema },
    friday: { type: DayHoursSchema },
    saturday: { type: DayHoursSchema },
  },
  { _id: false },
);

const GeoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: (v: number[]) => Array.isArray(v) && v.length === 2,
    },
  },
  { _id: false },
);

const ListingImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    isMain: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    alt: { type: bilingualStringRequired, required: true },
  },
  { _id: true },
);

const ListingVideoSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    thumbnail: { type: String, trim: true },
  },
  { _id: true },
);

const PackageSchema = new Schema(
  {
    name: { type: bilingualStringRequired, required: true },
    description: { type: bilingualStringRequired, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'SAR', trim: true },
    duration: {
      type: String,
      enum: PACKAGE_DURATIONS,
      required: true,
    },
    features: { type: [bilingualStringRequired], default: [] },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const RatingBreakdownSchema = new Schema(
  {
    1: { type: Number, default: 0, min: 0 },
    2: { type: Number, default: 0, min: 0 },
    3: { type: Number, default: 0, min: 0 },
    4: { type: Number, default: 0, min: 0 },
    5: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const ContactSchema = new Schema(
  {
    phone: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    email: { type: String, trim: true },
    website: { type: String, trim: true },
    instagram: { type: String, trim: true },
    snapchat: { type: String, trim: true },
    twitter: { type: String, trim: true },
  },
  { _id: false },
);

const LocationSchema = new Schema(
  {
    address: { type: bilingualStringRequired, required: true },
    city: { type: bilingualStringRequired, required: true },
    district: { type: bilingualStringRequired, required: true },
    coordinates: { type: GeoPointSchema, required: true },
    googleMapsUrl: { type: String, trim: true },
  },
  { _id: false },
);

const ListingSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    name: { type: bilingualStringRequired, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: { type: bilingualStringRequired, required: true },
    shortDescription: { type: bilingualStringRequired, required: true },
    location: { type: LocationSchema, required: true },
    images: { type: [ListingImageSchema], default: [] },
    videos: { type: [ListingVideoSchema], default: [] },
    virtualTourUrl: { type: String, trim: true },
    amenities: {
      type: [String],
      default: [],
      validate: {
        validator(keys: string[]) {
          return keys.every((k) =>
            (AMENITY_KEYS as readonly string[]).includes(k),
          );
        },
        message: 'Invalid amenity key',
      },
    },
    tags: { type: [String], default: [] },
    languages: {
      type: [String],
      default: [],
      validate: {
        validator(vals: string[]) {
          return vals.every((v) => v === 'ar' || v === 'en');
        },
        message: 'languages must be ar and/or en',
      },
    },
    packages: { type: [PackageSchema], default: [] },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    ratingBreakdown: {
      type: RatingBreakdownSchema,
      default: () => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
    },
    contact: { type: ContactSchema, default: () => ({}) },
    operatingHours: { type: OperatingHoursSchema, default: () => ({}) },
    is24Hours: { type: Boolean, default: false },
    status: {
      type: String,
      enum: LISTING_STATUSES,
      default: 'draft',
      index: true,
    },
    rejectionReason: { type: bilingualStringOptional },
    isVerified: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    views: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    contactClicks: { type: Number, default: 0, min: 0 },
    seoTitle: { type: bilingualStringOptional },
    seoDescription: { type: bilingualStringOptional },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

ListingSchema.index({ 'location.coordinates': '2dsphere' });

ListingSchema.index(
  {
    'name.ar': 'text',
    'name.en': 'text',
    'description.ar': 'text',
    'description.en': 'text',
  },
  {
    name: 'listing_text_search',
    default_language: 'none',
    weights: {
      'name.ar': 10,
      'name.en': 10,
      'description.ar': 2,
      'description.en': 2,
    },
  },
);

export const Listing =
  mongoose.models.Listing ?? mongoose.model('Listing', ListingSchema);
