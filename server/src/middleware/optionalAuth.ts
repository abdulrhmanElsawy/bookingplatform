import type { NextFunction, Request, Response } from 'express';
import type { Types } from 'mongoose';

import { getAccessTokenFromRequest } from '../lib/authCookies.js';
import { verifyAccessToken } from '../lib/jwt.js';
import type { UserRole } from '../modules/users/user.model.js';
import { User } from '../modules/users/user.model.js';

type LeanAuthUser = {
  _id: Types.ObjectId;
  email: string;
  role: UserRole;
} | null;

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = getAccessTokenFromRequest(req);
    if (!token) {
      next();
      return;
    }
    const payload = verifyAccessToken(token);
    const user = (await User.findOne({
      _id: payload.sub,
      isDeleted: false,
      isActive: true,
    })
      .select('_id email role')
      .lean()) as LeanAuthUser;

    if (user) {
      req.user = {
        id: String(user._id),
        email: user.email,
        role: user.role,
      };
    }
    next();
  } catch {
    next();
  }
}
