import type { TFunction } from 'i18next';

import {
  getApiErrorMessage,
  isApiLikeError,
} from '../apiErrorMessage';
import { ListingsApiError } from '../../features/listings/api/listingsApi';
import { AuthApiError } from '../../features/auth/api/authApi';

function makeT(): TFunction<'errors', undefined> {
  const dict: Record<string, string> = {
    networkError: 'NET',
    serverError: 'SRV',
    unauthorized: '401',
    forbidden: '403',
    notFound: '404',
    rateLimited: '429',
    uploadTooLarge: 'BIG',
    uploadInvalidType: 'TYPE',
    sessionExpired: 'SESS',
    validation: 'VAL',
  };
  return ((key: string) => dict[key] ?? key) as TFunction<'errors', undefined>;
}

describe('getApiErrorMessage', () => {
  const t = makeT();

  it('maps status codes to error keys', () => {
    expect(getApiErrorMessage(new ListingsApiError('x', 0), t)).toBe('NET');
    expect(getApiErrorMessage(new ListingsApiError('x', 403), t)).toBe('403');
    expect(getApiErrorMessage(new ListingsApiError('x', 404), t)).toBe('404');
    expect(getApiErrorMessage(new ListingsApiError('x', 429), t)).toBe('429');
    expect(getApiErrorMessage(new ListingsApiError('x', 503), t)).toBe('SRV');
    expect(getApiErrorMessage(new ListingsApiError('x', 413), t)).toBe('BIG');
    expect(getApiErrorMessage(new ListingsApiError('x', 415), t)).toBe('TYPE');
  });

  it('uses placeholder fallbacks', () => {
    expect(getApiErrorMessage(new ListingsApiError('error', 400), t)).toBe('VAL');
    expect(getApiErrorMessage(new ListingsApiError('error', 401), t)).toBe('401');
    expect(getApiErrorMessage(new ListingsApiError('oops', 418), t)).toBe('oops');
  });

  it('prefers server message for 401 when not a placeholder', () => {
    expect(
      getApiErrorMessage(new AuthApiError('Invalid credentials', 401), t),
    ).toBe('Invalid credentials');
  });

  it('maps SESSION_EXPIRED code', () => {
    expect(
      getApiErrorMessage(new AuthApiError('error', 401, 'SESSION_EXPIRED'), t),
    ).toBe('SESS');
  });

  it('handles TypeError as network', () => {
    expect(getApiErrorMessage(new TypeError('fail'), t)).toBe('NET');
  });

  it('isApiLikeError narrows Api errors', () => {
    expect(isApiLikeError(new ListingsApiError('x', 404))).toBe(true);
    expect(isApiLikeError(new Error('x'))).toBe(false);
  });
});
