import type { Request, Response } from 'express';

import { tRes } from '../../lib/i18nHttp.js';
import { httpError } from '../../middleware/errorHandler.js';
import * as reviewsService from './reviews.service.js';

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

export const listReviews = asyncHandler(async (req, res) => {
  const listing =
    typeof req.query.listing === 'string' ? req.query.listing.trim() : '';
  if (!listing) {
    throw httpError(400, tRes(res, 'validationError'));
  }
  const { page, limit } = parsePageLimit(req);
  const result = await reviewsService.listReviewsForListing({
    listingRef: listing,
    page,
    limit,
  });
  res.json(result);
});

export const createReview = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const review = await reviewsService.createReview(req.user.id, req.body);
  res.status(201).json({ review });
});

export const listReviewsForOwner = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const { page, limit } = parsePageLimit(req);
  const result = await reviewsService.listReviewsForOwner({
    ownerId: req.user.id,
    page,
    limit,
  });
  res.json(result);
});

export const replyToReviewAsOwner = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const reviewId =
    typeof req.params.reviewId === 'string' ? req.params.reviewId.trim() : '';
  const review = await reviewsService.replyToReviewAsOwner(
    req.lang,
    req.user.id,
    reviewId,
    req.body.content,
  );
  res.json({ review });
});
