import mongoose, { Schema } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'system_announcement',
  'listing_approved',
  'listing_rejected',
  'new_review',
  'new_booking',
  'payment_received',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const BilingualStringSchema = new Schema(
  {
    ar: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const NotificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: NOTIFICATION_TYPES,
      index: true,
    },
    title: { type: BilingualStringSchema, required: true },
    body: { type: BilingualStringSchema, required: true },
    read: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export const Notification =
  mongoose.models.Notification ??
  mongoose.model('Notification', NotificationSchema);
