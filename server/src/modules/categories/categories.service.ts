import type { Types } from 'mongoose';

import { isCategoryLive } from '../../lib/liveCategories.js';
import { Category } from './category.model.js';
import { Listing } from '../listings/listing.model.js';

export async function listActiveCategories(): Promise<unknown[]> {
  return Category.find({ isActive: true }).sort({ order: 1 }).lean();
}

export async function listCategoryListings(
  slug: string,
  page: number,
  limit: number,
): Promise<{
  category: unknown | null;
  listings: unknown[];
  total: number;
  page: number;
  limit: number;
}> {
  const normalizedSlug = slug.toLowerCase();
  if (!isCategoryLive(normalizedSlug)) {
    const category = await Category.findOne({ slug: normalizedSlug }).lean();
    return { category: category ?? null, listings: [], total: 0, page, limit };
  }
  const category = await Category.findOne({ slug: normalizedSlug }).lean();
  if (!category) {
    return { category: null, listings: [], total: 0, page, limit };
  }
  const filter = {
    status: 'active' as const,
    category: (category as { _id: Types.ObjectId })._id,
  };
  const total = await Listing.countDocuments(filter);
  const listings = await Listing.find(filter)
    .populate('category', 'slug name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return { category, listings, total, page, limit };
}
