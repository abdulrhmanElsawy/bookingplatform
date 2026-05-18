import { getApiUrl } from '../../../config/publicEnv';
import i18n from '../../../i18n';

export class ReviewsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ReviewsApiError';
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

export type ReviewRatingDto = {
  overall: number;
  staff: number;
  cleanliness: number;
  facilities: number;
  value: number;
};

export type ReviewUserDto = {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
};

export type ReviewDto = {
  _id: string;
  listing: string;
  user: ReviewUserDto;
  title: string;
  content: string;
  visitDate: string;
  visitType: 'individual' | 'group' | 'family';
  rating: ReviewRatingDto;
  images?: { url: string; publicId?: string }[];
  ownerReply?: { content: string; repliedAt: string };
  helpful?: string[];
  isVerified?: boolean;
  createdAt: string;
};

export type ReviewsListResponse = {
  reviews: ReviewDto[];
  total: number;
  page: number;
  limit: number;
};

export type ListingInfoDto = {
  _id: string;
  slug: string;
  name: { ar: string; en: string };
};

export type OwnerReviewRowDto = ReviewDto & {
  listingInfo: ListingInfoDto;
};

export type OwnerReviewsListResponse = {
  reviews: OwnerReviewRowDto[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchReviews(
  listingRef: string,
  page = 1,
  limit = 20,
): Promise<ReviewsListResponse> {
  const base = getApiUrl();
  if (!base) {
    throw new ReviewsApiError('API URL is not configured', 0);
  }
  const url = new URL(`${base}/api/reviews`);
  url.searchParams.set('listing', listingRef);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), {
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const body = (await parseJson(res)) as ReviewsListResponse | null;
  if (!res.ok) {
    throw new ReviewsApiError(
      messageFromBody(body) || 'Failed to load reviews',
      res.status,
    );
  }
  return {
    reviews: body?.reviews ?? [],
    total: body?.total ?? 0,
    page: body?.page ?? page,
    limit: body?.limit ?? limit,
  };
}

export type CreateReviewBody = {
  listing: string;
  rating: ReviewRatingDto;
  title: string;
  content: string;
  visitDate: string;
  visitType: 'individual' | 'group' | 'family';
  images?: { url: string; publicId?: string }[];
};

export async function postReview(payload: CreateReviewBody): Promise<ReviewDto> {
  const base = getApiUrl();
  if (!base) {
    throw new ReviewsApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/reviews`, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const parsed = await parseJson(res);
  if (!res.ok) {
    throw new ReviewsApiError(
      messageFromBody(parsed) || 'Failed to submit review',
      res.status,
    );
  }
  const data = parsed as { review?: ReviewDto };
  if (!data?.review) {
    throw new ReviewsApiError('Invalid response', res.status);
  }
  return data.review;
}

export async function fetchOwnerReviews(
  page = 1,
  limit = 20,
): Promise<OwnerReviewsListResponse> {
  const base = getApiUrl();
  if (!base) {
    throw new ReviewsApiError('API URL is not configured', 0);
  }
  const url = new URL(`${base}/api/reviews/for-owner`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), {
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const body = (await parseJson(res)) as OwnerReviewsListResponse | null;
  if (!res.ok) {
    throw new ReviewsApiError(
      messageFromBody(body) || 'Failed to load reviews',
      res.status,
    );
  }
  return {
    reviews: body?.reviews ?? [],
    total: body?.total ?? 0,
    page: body?.page ?? page,
    limit: body?.limit ?? limit,
  };
}

export async function postOwnerReviewReply(
  reviewId: string,
  content: string,
): Promise<OwnerReviewRowDto> {
  const base = getApiUrl();
  if (!base) {
    throw new ReviewsApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/reviews/${encodeURIComponent(reviewId)}/reply`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify({ content }),
  });
  const parsed = await parseJson(res);
  if (!res.ok) {
    throw new ReviewsApiError(
      messageFromBody(parsed) || 'Failed to post reply',
      res.status,
    );
  }
  const data = parsed as { review?: OwnerReviewRowDto };
  if (!data?.review) {
    throw new ReviewsApiError('Invalid response', res.status);
  }
  return data.review;
}
