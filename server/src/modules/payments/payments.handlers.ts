import type { Request, Response } from 'express';

import { tRes } from '../../lib/i18nHttp.js';
import { httpError } from '../../middleware/errorHandler.js';
import * as paymentsService from './payments.service.js';

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

export const getPlanCatalog = asyncHandler(async (_req, res) => {
  res.json({ plans: paymentsService.getPlanCatalog() });
});

export const postSimulateCheckout = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const planKey = req.body.planKey;
  const transaction = await paymentsService.simulatePlanCheckout(req.user.id, planKey);
  res.status(201).json({ transaction });
});

export const listMyTransactions = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw httpError(401, tRes(res, 'unauthorized'));
  }
  const { page, limit } = parsePageLimit(req);
  const result = await paymentsService.listMySimulatedPayments(req.user.id, page, limit);
  res.json(result);
});
