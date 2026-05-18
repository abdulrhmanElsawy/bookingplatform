import type { NextFunction, Request, Response } from 'express';

import type { AuthUser } from '../../types/express.js';
import { tRes } from '../../lib/i18nHttp.js';
import { isMongoObjectId } from '../../lib/objectId.js';
import { httpError } from '../../middleware/errorHandler.js';
import * as adminAuditService from './adminAudit.service.js';
import * as adminCmsService from './admin-cms.service.js';
import * as adminService from './admin.service.js';
import * as settingsService from '../settings/settings.service.js';

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

function parseBoolQuery(val: unknown): boolean | undefined {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return undefined;
}

function requireActor(req: Request): AuthUser {
  if (!req.user) {
    throw httpError(401, 'Unauthorized');
  }
  return req.user;
}

export function requireAdminObjectId(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const raw = req.params[paramName];
    const id = typeof raw === 'string' ? raw.trim() : '';
    if (!id || !isMongoObjectId(id)) {
      next(httpError(404, tRes(res, 'notFound')));
      return;
    }
    next();
  };
}

export const requireAdminUserObjectId = requireAdminObjectId('userId');
export const requireAdminListingObjectId = requireAdminObjectId('id');
export const requireAdminReviewObjectId = requireAdminObjectId('id');
export const requireAdminCategoryObjectId = requireAdminObjectId('id');
export const requireAdminSubscriptionObjectId = requireAdminObjectId('id');

export const getAdminOverview = asyncHandler(async (_req, res) => {
  const overview = await adminService.getAdminOverview();
  res.json({ overview });
});

export const listAdminUsers = asyncHandler(async (req, res) => {
  const { page, limit } = parsePageLimit(req);
  const search =
    typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const result = await adminService.listUsersForAdmin({ page, limit, search });
  res.json(result);
});

export const patchAdminUser = asyncHandler(async (req, res) => {
  const actor = requireActor(req);
  const userId = req.params.userId;
  if (!userId) {
    throw httpError(404, tRes(res, 'notFound'));
  }
  const user = await adminService.patchUserAsAdmin(
    req.lang,
    actor.id,
    actor.role as Parameters<typeof adminService.patchUserAsAdmin>[2],
    userId,
    req.body,
  );
  res.json({ user });
});

export const postAdminBroadcast = asyncHandler(async (req, res) => {
  const actor = requireActor(req);
  const result = await adminService.sendAdminBroadcast(req.body, actor.id);
  res.status(201).json(result);
});

export const listAdminListings = asyncHandler(async (req, res) => {
  const { page, limit } = parsePageLimit(req);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const result = await adminCmsService.listListingsForAdmin({
    page,
    limit,
    status,
    search,
    category,
    isFeatured: parseBoolQuery(req.query.isFeatured),
    isPremium: parseBoolQuery(req.query.isPremium),
    isVerified: parseBoolQuery(req.query.isVerified),
  });
  res.json(result);
});

export const patchAdminListing = asyncHandler(async (req, res) => {
  const actor = requireActor(req);
  const id = req.params.id;
  if (!id) throw httpError(404, tRes(res, 'notFound'));
  const listing = await adminCmsService.patchListingAsAdmin(req.lang, actor.id, id, req.body);
  res.json({ listing });
});

export const deleteAdminListing = asyncHandler(async (req, res) => {
  const actor = requireActor(req);
  const id = req.params.id;
  if (!id) throw httpError(404, tRes(res, 'notFound'));
  await adminCmsService.deleteListingAsAdmin(req.lang, actor, actor.id, id);
  res.status(204).send();
});

export const listAdminReviews = asyncHandler(async (req, res) => {
  const { page, limit } = parsePageLimit(req);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const result = await adminCmsService.listReviewsForAdmin({ page, limit, status });
  res.json(result);
});

export const patchAdminReviewStatus = asyncHandler(async (req, res) => {
  const actor = requireActor(req);
  const id = req.params.id;
  if (!id) throw httpError(404, tRes(res, 'notFound'));
  await adminCmsService.patchReviewStatusAsAdmin(req.lang, actor.id, id, req.body);
  res.status(204).send();
});

export const listAdminCategories = asyncHandler(async (_req, res) => {
  const result = await adminCmsService.listCategoriesForAdmin();
  res.json(result);
});

export const createAdminCategory = asyncHandler(async (req, res) => {
  const actor = requireActor(req);
  const category = await adminCmsService.createCategoryAsAdmin(actor.id, req.body);
  res.status(201).json({ category });
});

export const patchAdminCategory = asyncHandler(async (req, res) => {
  const actor = requireActor(req);
  const id = req.params.id;
  if (!id) throw httpError(404, tRes(res, 'notFound'));
  const category = await adminCmsService.patchCategoryAsAdmin(req.lang, actor.id, id, req.body);
  res.json({ category });
});

export const deleteAdminCategory = asyncHandler(async (req, res) => {
  const actor = requireActor(req);
  const id = req.params.id;
  if (!id) throw httpError(404, tRes(res, 'notFound'));
  await adminCmsService.deleteCategoryAsAdmin(req.lang, actor.id, id);
  res.status(204).send();
});

export const listAdminSubscriptions = asyncHandler(async (req, res) => {
  const { page, limit } = parsePageLimit(req);
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const result = await adminCmsService.listSubscriptionsForAdmin({ page, limit, search });
  res.json(result);
});

export const patchAdminSubscription = asyncHandler(async (req, res) => {
  const actor = requireActor(req);
  const id = req.params.id;
  if (!id) throw httpError(404, tRes(res, 'notFound'));
  await adminCmsService.patchSubscriptionAsAdmin(req.lang, actor.id, id, req.body);
  res.status(204).send();
});

export const getAdminPaymentsSummary = asyncHandler(async (_req, res) => {
  const summary = await adminCmsService.getPaymentsSummary();
  res.json({ summary });
});

export const listAdminPaymentTransactions = asyncHandler(async (req, res) => {
  const { page, limit } = parsePageLimit(req);
  const result = await adminCmsService.listPaymentTransactionsForAdmin({ page, limit });
  res.json(result);
});

export const getAdminHomeContent = asyncHandler(async (_req, res) => {
  const content = await adminCmsService.getHomeContentPreview();
  res.json({ content });
});

export const getAdminSettings = asyncHandler(async (_req, res) => {
  const settings = await settingsService.getOrCreateSiteSettings();
  res.json({ settings });
});

export const patchAdminSettings = asyncHandler(async (req, res) => {
  const actor = requireActor(req);
  const settings = await settingsService.patchSiteSettings(req.body);
  await adminAuditService.logAdminAudit({
    actorId: actor.id,
    action: 'settings.patch',
    targetType: 'settings',
    metadata: req.body as Record<string, unknown>,
  });
  res.json({ settings });
});

export const listAdminAudit = asyncHandler(async (req, res) => {
  const { page, limit } = parsePageLimit(req);
  const action = typeof req.query.action === 'string' ? req.query.action : undefined;
  const result = await adminAuditService.listAdminAudit({ page, limit, action });
  res.json(result);
});
