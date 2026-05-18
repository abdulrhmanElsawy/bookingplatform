import type { Request, Response } from 'express';

import { tRes } from '../../lib/i18nHttp.js';
import { httpError } from '../../middleware/errorHandler.js';
import * as favoritesService from './favorites.service.js';

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

export const getFavoriteStatus = asyncHandler(async (req, res) => {
  const listing =
    typeof req.query.listing === 'string' ? req.query.listing.trim() : '';
  if (!listing) {
    throw httpError(400, tRes(res, 'validationError'));
  }
  const userId = req.user?.id;
  const result = await favoritesService.getFavoriteStatus(userId, listing);
  res.json(result);
});

export const listFavorites = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const { page, limit } = parsePageLimit(req);
  const result = await favoritesService.listUserFavorites({
    userId: req.user.id,
    page,
    limit,
  });
  res.json(result);
});

export const addFavorite = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const result = await favoritesService.addFavorite(req.user.id, req.body.listing);
  res.status(201).json(result);
});

export const removeFavorite = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const listing =
    typeof req.query.listing === 'string' ? req.query.listing.trim() : '';
  if (!listing) {
    throw httpError(400, tRes(res, 'validationError'));
  }
  await favoritesService.removeFavorite(req.user.id, listing);
  res.status(204).send();
});
