import type { NextFunction, Request, Response } from 'express';

import { languageMiddleware } from '../languageMiddleware';

describe('languageMiddleware', () => {
  it('defaults to ar when Accept-Language is missing', () => {
    const req = { headers: {} } as Request;
    const res = { locals: {} } as Response;
    const next = jest.fn() as NextFunction;

    languageMiddleware(req, res, next);

    expect(req.lang).toBe('ar');
    expect(res.locals.lang).toBe('ar');
    expect(next).toHaveBeenCalled();
  });

  it('sets en when Accept-Language starts with en', () => {
    const req = { headers: { 'accept-language': 'en-US,en;q=0.9' } } as Request;
    const res = { locals: {} } as Response;
    const next = jest.fn() as NextFunction;

    languageMiddleware(req, res, next);

    expect(req.lang).toBe('en');
    expect(res.locals.lang).toBe('en');
  });
});
