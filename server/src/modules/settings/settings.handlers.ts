import type { Request, Response } from 'express';

import * as settingsService from './settings.service.js';

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: (err: unknown) => void) => void {
  return (req, res, next) => {
    void fn(req, res).catch(next);
  };
}

export const getPublicSettings = asyncHandler(async (_req, res) => {
  const settings = await settingsService.getPublicSiteSettings();
  res.json({ settings });
});
