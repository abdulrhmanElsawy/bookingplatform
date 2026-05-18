import { getApiUrl } from '../../../config/publicEnv';
import i18n from '../../../i18n';
import type { ListingListItemDto } from '../../listings/api/listingsApi';

export class FavoritesApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'FavoritesApiError';
  }
}

function acceptLanguageHeader(): string {
  const lng = i18n.language?.toLowerCase() ?? 'ar';
  return lng.startsWith('en') ? 'en' : 'ar';
}

function jsonHeaders(): HeadersInit {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Language': acceptLanguageHeader(),
  };
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function messageFromBody(body: unknown): string {
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    body.error &&
    typeof body.error === 'object' &&
    'message' in body.error &&
    typeof (body.error as { message: unknown }).message === 'string'
  ) {
    return (body.error as { message: string }).message;
  }
  return '';
}

export type FavoriteRow = {
  _id: string;
  listing: ListingListItemDto | null;
};

export type FavoritesListResponse = {
  favorites: FavoriteRow[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchFavoriteStatus(
  listingSlug: string,
): Promise<{ favorited: boolean }> {
  const base = getApiUrl();
  if (!base) {
    throw new FavoritesApiError('API URL is not configured', 0);
  }
  const url = new URL(`${base}/api/favorites/status`);
  url.searchParams.set('listing', listingSlug);
  const res = await fetch(url.toString(), {
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const body = (await parseJson(res)) as { favorited?: boolean } | null;
  if (!res.ok) {
    throw new FavoritesApiError(
      messageFromBody(body) || 'Failed to load favorite status',
      res.status,
    );
  }
  return { favorited: Boolean(body?.favorited) };
}

export async function fetchFavorites(
  page = 1,
  limit = 24,
): Promise<FavoritesListResponse> {
  const base = getApiUrl();
  if (!base) {
    throw new FavoritesApiError('API URL is not configured', 0);
  }
  const url = new URL(`${base}/api/favorites`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), {
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const body = (await parseJson(res)) as FavoritesListResponse | null;
  if (!res.ok) {
    throw new FavoritesApiError(
      messageFromBody(body) || 'Failed to load favorites',
      res.status,
    );
  }
  return {
    favorites: body?.favorites ?? [],
    total: body?.total ?? 0,
    page: body?.page ?? page,
    limit: body?.limit ?? limit,
  };
}

export async function addFavorite(listingSlug: string): Promise<void> {
  const base = getApiUrl();
  if (!base) {
    throw new FavoritesApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/favorites`, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify({ listing: listingSlug }),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new FavoritesApiError(
      messageFromBody(body) || 'Failed to add favorite',
      res.status,
    );
  }
}

export async function removeFavorite(listingSlug: string): Promise<void> {
  const base = getApiUrl();
  if (!base) {
    throw new FavoritesApiError('API URL is not configured', 0);
  }
  const url = new URL(`${base}/api/favorites`);
  url.searchParams.set('listing', listingSlug);
  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const body = await parseJson(res);
  if (!res.ok && res.status !== 204) {
    throw new FavoritesApiError(
      messageFromBody(body) || 'Failed to remove favorite',
      res.status,
    );
  }
}
