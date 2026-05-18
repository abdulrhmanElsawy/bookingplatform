import type { NextFunction, Request, Response } from 'express';

import { authorize } from '../authorize';

describe('authorize', () => {
  it('returns 401 when user missing', () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    authorize('admin')(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('returns 403 when role not allowed', () => {
    const req = {
      user: { id: '1', email: 'a@b.com', role: 'user' },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    authorize('admin', 'super_admin')(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it('calls next when role allowed', () => {
    const req = {
      user: { id: '1', email: 'a@b.com', role: 'admin' },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    authorize('admin', 'super_admin')(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
