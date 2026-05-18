import type { Request, Response } from 'express';

import { tRes } from '../../lib/i18nHttp.js';
import { httpError } from '../../middleware/errorHandler.js';
import * as subscriptionsService from './subscriptions.service.js';

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

export const postSimulateVenueSubscription = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const { listingSlug, packageId } = req.body as {
    listingSlug: string;
    packageId: string;
  };
  const subscription = await subscriptionsService.simulateVenueSubscription(
    req.user.id,
    listingSlug,
    packageId,
  );
  res.status(201).json({ subscription });
});

export const listMySubscriptions = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const { page, limit } = parsePageLimit(req);
  const result = await subscriptionsService.listMyVenueSubscriptions(req.user.id, page, limit);
  res.json(result);
});

export const postVerifyAccessCode = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const { accessCode, listingId } = req.body as {
    accessCode: string;
    listingId?: string;
  };
  const result = await subscriptionsService.verifyAccessCode(
    req.user.id,
    accessCode,
    listingId,
  );
  res.json(result);
});
