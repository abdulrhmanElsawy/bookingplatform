import type { NextFunction, Request, Response } from 'express';

import { tRes } from '../lib/i18nHttp.js';

export interface HttpError extends Error {
  status?: number;
  code?: string;
}

function messageForStatus(
  res: Response,
  status: number,
  err: HttpError,
): string {
  if (status >= 500) {
    return tRes(res, 'serverError');
  }
  switch (status) {
    case 400:
      return err.message?.trim() ? err.message : tRes(res, 'validationError');
    case 401:
      return err.message?.trim() ? err.message : tRes(res, 'unauthorized');
    case 403:
      return err.message?.trim() ? err.message : tRes(res, 'forbidden');
    case 404:
      return tRes(res, 'notFound');
    case 409:
      return err.message?.trim() ? err.message : tRes(res, 'serverError');
    case 429:
      return err.message?.trim() ? err.message : tRes(res, 'serverError');
    default:
      return err.message?.trim() ? err.message : tRes(res, 'serverError');
  }
}

export function httpError(status: number, message: string, code?: string): HttpError {
  return Object.assign(new Error(message), { status, code });
}

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status =
    err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  const message = messageForStatus(res, status, err);

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  res.status(status).json({
    error: {
      message,
      code: err.code,
    },
  });
}
