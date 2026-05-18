import mongoose, { Schema } from 'mongoose';

import {
  bilingualStringOptional,
  bilingualStringRequired,
} from '../../lib/mongooseBilingual.js';

const CategorySchema = new Schema(
  {
    name: { type: bilingualStringRequired, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    icon: { type: String, trim: true },
    description: { type: bilingualStringOptional },
    parentCategory: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    image: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    listingCount: { type: Number, default: 0 },
    seoTitle: { type: bilingualStringOptional },
    seoDescription: { type: bilingualStringOptional },
  },
  { timestamps: true },
);

export const Category =
  mongoose.models.Category ?? mongoose.model('Category', CategorySchema);
