import type { NextFunction, Request, Response } from 'express';

import * as jwt from '../../lib/jwt';
import { User } from '../../modules/users/user.model';
import { refreshTokenMiddleware } from '../refreshToken';

describe('refreshTokenMiddleware', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('401 when refresh cookie missing', async () => {
    const req = { cookies: {} } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await refreshTokenMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('attaches user when refresh JWT and DB state match', async () => {
    const userId = '507f1f77bcf86cd799439011';
    jest.spyOn(jwt, 'verifyRefreshToken').mockReturnValue({
      sub: userId,
      typ: 'refresh',
      jti: 'jti-1',
    });

    const lean = jest.fn().mockResolvedValue({
      _id: userId,
      email: 'u@test.com',
      role: 'user',
    });
    jest.spyOn(User, 'findOne').mockReturnValue({
      select: () => ({ lean }),
    } as never);

    const req = {
      cookies: { gw_refresh_token: 'raw-refresh-token' },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await refreshTokenMiddleware(req, res, next);

    expect(req.user).toEqual({
      id: userId,
      email: 'u@test.com',
      role: 'user',
    });
    expect(next).toHaveBeenCalled();
  });
});
