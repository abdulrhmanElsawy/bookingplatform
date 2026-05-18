import type { NextFunction, Request, Response } from 'express';

import { signAccessToken } from '../../lib/jwt';
import { User } from '../../modules/users/user.model';
import { optionalAuth } from '../optionalAuth';

describe('optionalAuth', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('continues without user when no token', async () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeUndefined();
  });

  it('ignores invalid token and continues', async () => {
    const req = { headers: { authorization: 'Bearer not-a-jwt' } } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeUndefined();
  });

  it('attaches user when token valid', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const token = signAccessToken(userId, 'user');
    const lean = jest.fn().mockResolvedValue({
      _id: userId,
      email: 'u@test.com',
      role: 'user',
    });
    jest.spyOn(User, 'findOne').mockReturnValue({
      select: () => ({ lean }),
    } as never);

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await optionalAuth(req, res, next);

    expect(req.user?.id).toBe(userId);
    expect(next).toHaveBeenCalledWith();
  });
});
