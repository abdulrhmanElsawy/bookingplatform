import type { Types } from 'mongoose';

import { isCategoryLive, LIVE_CATEGORY_SLUGS } from '@growth-world/shared';

import { Category } from '../modules/categories/category.model.js';

export async function getLiveCategoryIds(): Promise<Types.ObjectId[]> {
  const categories = await Category.find({
    slug: { $in: [...LIVE_CATEGORY_SLUGS] },
    isActive: true,
  })
    .select('_id')
    .lean<{ _id: Types.ObjectId }[]>();
  return categories.map((c) => c._id);
}

export { isCategoryLive };
