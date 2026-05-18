import type { NextFunction, Request, Response } from 'express';

import type { UserRole } from '../modules/users/user.model.js';
import type { HttpError } from './errorHandler.js';

export function authorize(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(Object.assign(new Error('Unauthorized'), { status: 401 }) as HttpError);
      return;
    }
    if (!allowed.includes(req.user.role)) {
      next(Object.assign(new Error('Forbidden'), { status: 403 }) as HttpError);
      return;
    }
    next();
  };
}
