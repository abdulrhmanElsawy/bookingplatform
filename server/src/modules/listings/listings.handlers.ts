import type { Request, Response } from 'express';
import { isCategoryLive } from '@growth-world/shared';

import { tRes } from '../../lib/i18nHttp.js';
import { httpError } from '../../middleware/errorHandler.js';
import * as categoriesService from '../categories/categories.service.js';
import * as listingsService from './listings.service.js';

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: (err: unknown) => void) => void {
  return (req, res, next) => {
    void fn(req, res).catch(next);
  };
}

function parsePageLimit(req: Request): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limitRaw = parseInt(String(req.query.limit ?? '20'), 10) || 20;
  const limit = Math.min(50, Math.max(1, limitRaw));
  return { page, limit };
}

export const listListings = asyncHandler(async (req, res) => {
  const { page, limit } = parsePageLimit(req);
  const search =
    typeof req.query.search === 'string'
      ? req.query.search
      : typeof req.query.q === 'string'
        ? req.query.q
        : undefined;
  const category =
    typeof req.query.category === 'string' ? req.query.category : undefined;
  const sort =
    typeof req.query.sort === 'string' ? req.query.sort : undefined;
  const isPremium =
    req.query.isPremium === 'true' ? true : undefined;

  const result = await listingsService.listListings({
    page,
    limit,
    search,
    category,
    sort,
    isPremium,
  });
  res.json(result);
});

export const listFeatured = asyncHandler(async (req, res) => {
  const limitRaw = parseInt(String(req.query.limit ?? '20'), 10) || 20;
  const limit = Math.min(50, Math.max(1, limitRaw));
  const result = await listingsService.listFeatured(limit);
  res.json(result);
});

export const listNearby = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw httpError(400, tRes(res, 'validationError'));
  }
  const limitRaw = parseInt(String(req.query.limit ?? '20'), 10) || 20;
  const limit = Math.min(50, Math.max(1, limitRaw));
  const maxKm = Math.min(200, Math.max(1, Number(req.query.maxKm) || 10));
  const result = await listingsService.listNearby({ lat, lng, limit, maxKm });
  res.json(result);
});

export const getListing = asyncHandler(async (req, res) => {
  const param = req.params.slugOrId;
  if (!param) {
    throw httpError(404, tRes(res, 'notFound'));
  }
  const listing = await listingsService.getListingBySlugOrId(
    req.lang,
    param,
    req.user,
  );
  res.json({ listing });
});

export const createListing = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const listing = await listingsService.createListing(req.lang, req.user, req.body);
  res.status(201).json({ listing });
});

export const updateListing = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const id = req.params.id;
  if (!id) {
    throw httpError(404, tRes(res, 'notFound'));
  }
  const listing = await listingsService.updateListing(
    req.lang,
    req.user,
    id,
    req.body,
  );
  res.json({ listing });
});

export const removeListing = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const id = req.params.id;
  if (!id) {
    throw httpError(404, tRes(res, 'notFound'));
  }
  await listingsService.deleteListing(req.lang, req.user, id);
  res.status(204).send();
});

export const patchListingStatus = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!id) {
    throw httpError(404, tRes(res, 'notFound'));
  }
  const listing = await listingsService.patchListingStatus(req.lang, id, req.body);
  res.json({ listing });
});

export const getListingAnalytics = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const id = req.params.listingId;
  if (!id) {
    throw httpError(404, tRes(res, 'notFound'));
  }
  const analytics = await listingsService.getListingAnalytics(
    req.lang,
    req.user,
    id,
  );
  res.json({ analytics });
});

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await categoriesService.listActiveCategories();
  const enriched = (categories as Array<{ slug: string }>).map((c) => ({
    ...c,
    isBookable: isCategoryLive(c.slug),
  }));
  res.json({ categories: enriched });
});

export const listCategoryListings = asyncHandler(async (req, res) => {
  const slug = req.params.slug;
  if (!slug) {
    throw httpError(404, tRes(res, 'notFound'));
  }
  const { page, limit } = parsePageLimit(req);
  const result = await categoriesService.listCategoryListings(slug, page, limit);
  if (!result.category) {
    throw httpError(404, tRes(res, 'notFound'));
  }
  res.json(result);
});
