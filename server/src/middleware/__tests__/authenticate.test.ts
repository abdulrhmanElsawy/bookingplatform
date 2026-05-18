import type { NextFunction, Request, Response } from 'express';

import { signAccessToken } from '../../lib/jwt';
import { User } from '../../modules/users/user.model';
import { authenticate } from '../authenticate';

describe('authenticate', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('attaches user when Bearer token is valid', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const token = signAccessToken(userId, 'user');

    const lean = jest.fn().mockResolvedValue({
      _id: userId,
      email: 'user@test.com',
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

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: userId,
      email: 'user@test.com',
      role: 'user',
    });
  });

  it('calls next with 401 when token missing', async () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401 }),
    );
    expect(req.user).toBeUndefined();
  });
});
