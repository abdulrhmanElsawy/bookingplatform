import mongoose, { Schema } from 'mongoose';

import { bilingualStringOptional } from '../../lib/mongooseBilingual.js';

const SiteSettingsSchema = new Schema(
  {
    maintenanceMode: { type: Boolean, default: false },
    allowRegistration: { type: Boolean, default: true },
    reviewsRequireModeration: { type: Boolean, default: false },
    defaultLanguage: { type: String, enum: ['ar', 'en'], default: 'ar' },
    announcementBanner: { type: bilingualStringOptional },
  },
  { timestamps: true },
);

export const SiteSettings =
  mongoose.models.SiteSettings ?? mongoose.model('SiteSettings', SiteSettingsSchema);
