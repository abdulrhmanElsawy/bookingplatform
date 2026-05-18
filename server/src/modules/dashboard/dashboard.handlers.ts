import type { Request, Response } from 'express';

import { tRes } from '../../lib/i18nHttp.js';
import { httpError } from '../../middleware/errorHandler.js';
import * as dashboardService from './dashboard.service.js';

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: (err: unknown) => void) => void {
  return (req, res, next) => {
    void fn(req, res).catch(next);
  };
}

export const getOwnerOverview = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const overview = await dashboardService.getOwnerOverview(req.user.id);
  res.json({ overview });
});

export const getOwnerListings = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const listings = await dashboardService.getOwnerListings(req.user.id);
  res.json({ listings });
});
