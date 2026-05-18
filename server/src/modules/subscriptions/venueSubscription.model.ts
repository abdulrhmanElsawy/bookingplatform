import mongoose, { Schema } from 'mongoose';

import {
  bilingualStringRequired,
} from '../../lib/mongooseBilingual.js';
import { PACKAGE_DURATIONS } from '../listings/listing.model.js';

export const SUBSCRIPTION_STATUSES = ['active', 'expired', 'cancelled'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

const PackageSnapshotSchema = new Schema(
  {
    name: { type: bilingualStringRequired, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'SAR', trim: true },
    duration: {
      type: String,
      enum: PACKAGE_DURATIONS,
      required: true,
    },
  },
  { _id: false },
);

const VenueSubscriptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    packageId: { type: Schema.Types.ObjectId, required: true },
    packageSnapshot: { type: PackageSnapshotSchema, required: true },
    accessCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: 'active',
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'SAR', trim: true },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true, index: true },
    simulatedPaymentRef: { type: String, trim: true },
  },
  { timestamps: true },
);

VenueSubscriptionSchema.index({ user: 1, listing: 1, createdAt: -1 });

export const VenueSubscription = mongoose.model('VenueSubscription', VenueSubscriptionSchema);
