import type { BilingualField } from '@growth-world/shared';

import { getApiUrl } from '../../../config/publicEnv';
import i18n from '../../../i18n';

export class ListingsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ListingsApiError';
  }
}

function acceptLanguageHeader(): string {
  const lng = i18n.language?.toLowerCase() ?? 'ar';
  return lng.startsWith('en') ? 'en' : 'ar';
}

function jsonHeaders(): HeadersInit {
  return {
    Accept: 'application/json',
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

export type CategoryDto = {
  _id: string;
  slug: string;
  name: BilingualField;
  image?: string;
  isActive?: boolean;
  isBookable?: boolean;
  order?: number;
};

export type ListingListItemDto = {
  _id: string;
  slug: string;
  name: BilingualField;
  location: { city: BilingualField };
  amenities: string[];
  packages: { price: number; duration?: string }[];
  totalReviews: number;
  averageRating?: number;
  is24Hours?: boolean;
  createdAt?: string;
  images?: {
    url: string;
    alt?: BilingualField;
    isMain?: boolean;
  }[];
  isFeatured?: boolean;
  isVerified?: boolean;
  category?: CategoryDto | null;
};

export type ListingsListResponse = {
  listings: ListingListItemDto[];
  total: number;
  page: number;
  limit: number;
};

export type ListingOperatingHoursDto = Partial<
  Record<
    | 'sunday'
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday',
    { isOpen?: boolean; open?: string; close?: string }
  >
>;

export type ListingBranchDto = {
  _id?: string;
  name: BilingualField;
  address: BilingualField;
  city: BilingualField;
  district: BilingualField;
  googleMapsUrl?: string;
  coordinates?: { type: 'Point'; coordinates: [number, number] };
  phone?: string;
  whatsapp?: string;
  images?: {
    url: string;
    publicId?: string;
    alt?: BilingualField;
    isMain?: boolean;
    order?: number;
  }[];
  operatingHours?: ListingOperatingHoursDto;
  is24Hours?: boolean;
  isMain?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export type ListingDetailDto = {
  _id: string;
  slug: string;
  name: BilingualField;
  description: BilingualField;
  shortDescription: BilingualField;
  location: {
    address: BilingualField;
    city: BilingualField;
    district: BilingualField;
    googleMapsUrl?: string;
    coordinates?: { type: 'Point'; coordinates: [number, number] };
  };
  branches?: ListingBranchDto[];
  images?: {
    url: string;
    publicId?: string;
    alt?: BilingualField;
    isMain?: boolean;
    order?: number;
  }[];
  videos?: { url: string; thumbnail?: string }[];
  virtualTourUrl?: string;
  amenities: string[];
  packages?: Array<{
    _id: string;
    name: BilingualField;
    description: BilingualField;
    price: number;
    currency?: string;
    duration: string;
    features?: BilingualField[];
    isPopular?: boolean;
    isActive?: boolean;
  }>;
  contact?: Partial<{
    phone: string;
    whatsapp: string;
    email: string;
    website: string;
    instagram: string;
    snapchat: string;
    twitter: string;
  }>;
  operatingHours?: ListingOperatingHoursDto;
  is24Hours?: boolean;
  averageRating?: number;
  totalReviews?: number;
  ratingBreakdown?: Partial<Record<'1' | '2' | '3' | '4' | '5', number>>;
  isVerified?: boolean;
  isFeatured?: boolean;
  category?: CategoryDto | null;
  status?: 'draft' | 'pending' | 'active' | 'rejected' | 'suspended';
  rejectionReason?: { ar: string; en: string };
};

export async function fetchCategories(): Promise<CategoryDto[]> {
  const base = getApiUrl();
  if (!base) {
    throw new ListingsApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/categories`, { headers: jsonHeaders() });
  const body = (await parseJson(res)) as { categories?: CategoryDto[] } | null;
  if (!res.ok) {
    throw new ListingsApiError('Failed to load categories', res.status);
  }
  return body?.categories ?? [];
}

export type ListingsQueryParams = {
  search?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
  isPremium?: boolean;
};

export type FeaturedListingsResponse = {
  listings: ListingListItemDto[];
};

export async function fetchFeaturedListings(limit = 8): Promise<FeaturedListingsResponse> {
  const base = getApiUrl();
  if (!base) {
    throw new ListingsApiError('API URL is not configured', 0);
  }
  const url = new URL(`${base}/api/listings/featured`);
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), { headers: jsonHeaders() });
  const body = (await parseJson(res)) as { listings?: ListingListItemDto[] } | null;
  if (!res.ok) {
    throw new ListingsApiError('Failed to load featured listings', res.status);
  }
  return { listings: body?.listings ?? [] };
}

export async function fetchListings(
  params: ListingsQueryParams,
): Promise<ListingsListResponse> {
  const base = getApiUrl();
  if (!base) {
    throw new ListingsApiError('API URL is not configured', 0);
  }
  const url = new URL(`${base}/api/listings`);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.category) url.searchParams.set('category', params.category);
  if (params.sort) url.searchParams.set('sort', params.sort);
  if (params.page != null) url.searchParams.set('page', String(params.page));
  if (params.limit != null) url.searchParams.set('limit', String(params.limit));
  if (params.isPremium === true) url.searchParams.set('isPremium', 'true');

  const res = await fetch(url.toString(), { headers: jsonHeaders() });
  const body = (await parseJson(res)) as ListingsListResponse | null;
  if (!res.ok) {
    throw new ListingsApiError('Failed to load listings', res.status);
  }
  return {
    listings: body?.listings ?? [],
    total: body?.total ?? 0,
    page: body?.page ?? 1,
    limit: body?.limit ?? 20,
  };
}

export type CreateListingPackagePayload = {
  name: BilingualField;
  description: BilingualField;
  price: number;
  currency?: string;
  duration: 'day' | 'week' | 'month' | 'quarter' | 'year';
  features?: BilingualField[];
  isPopular?: boolean;
  isActive?: boolean;
};

export type CreateListingImagePayload = {
  url: string;
  publicId?: string;
  isMain?: boolean;
  order?: number;
  alt: BilingualField;
};

export type CreateListingBranchPayload = {
  name: BilingualField;
  address: BilingualField;
  city: BilingualField;
  district: BilingualField;
  googleMapsUrl: string;
  coordinates?: { type: 'Point'; coordinates: [number, number] };
  phone?: string;
  whatsapp?: string;
  images?: CreateListingImagePayload[];
  operatingHours?: ListingOperatingHoursDto;
  is24Hours?: boolean;
  isMain?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export type CreateListingPayload = {
  category: string;
  name: BilingualField;
  description: BilingualField;
  shortDescription: BilingualField;
  location: {
    address: BilingualField;
    city: BilingualField;
    district: BilingualField;
    googleMapsUrl: string;
    coordinates?: { type: 'Point'; coordinates: [number, number] };
  };
  branches?: CreateListingBranchPayload[];
  images?: CreateListingImagePayload[];
  videos?: { url: string; thumbnail?: string }[];
  virtualTourUrl?: string;
  amenities?: string[];
  tags?: string[];
  languages?: ('ar' | 'en')[];
  packages?: CreateListingPackagePayload[];
  contact?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
    instagram?: string;
    snapchat?: string;
    twitter?: string;
  };
  operatingHours?: ListingOperatingHoursDto;
  is24Hours?: boolean;
  status?: 'draft' | 'pending' | 'active' | 'rejected' | 'suspended';
  seoTitle?: { ar?: string; en?: string };
  seoDescription?: { ar?: string; en?: string };
};

export async function createListing(body: CreateListingPayload): Promise<Record<string, unknown>> {
  const base = getApiUrl();
  if (!base) {
    throw new ListingsApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/listings`, {
    method: 'POST',
    headers: {
      ...jsonHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new ListingsApiError(messageFromBody(data) || 'Request failed', res.status);
  }
  const typed = data as { listing?: Record<string, unknown> };
  if (!typed.listing) {
    throw new ListingsApiError('Invalid response', res.status);
  }
  return typed.listing;
}

export type UpdateListingPayload = CreateListingPayload;

export async function updateListing(
  listingId: string,
  body: UpdateListingPayload,
): Promise<Record<string, unknown>> {
  const base = getApiUrl();
  if (!base) {
    throw new ListingsApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/listings/${encodeURIComponent(listingId)}`, {
    method: 'PUT',
    headers: {
      ...jsonHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new ListingsApiError(messageFromBody(data) || 'Request failed', res.status);
  }
  const typed = data as { listing?: Record<string, unknown> };
  if (!typed.listing) {
    throw new ListingsApiError('Invalid response', res.status);
  }
  return typed.listing;
}

export async function deleteListing(listingId: string): Promise<void> {
  const base = getApiUrl();
  if (!base) {
    throw new ListingsApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/listings/${encodeURIComponent(listingId)}`, {
    method: 'DELETE',
    headers: jsonHeaders(),
    credentials: 'include',
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new ListingsApiError(messageFromBody(data) || 'Request failed', res.status);
  }
}

export type PatchListingStatusPayload = {
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'suspended';
  rejectionReason?: { ar: string; en: string };
};

export async function patchListingStatus(
  listingId: string,
  body: PatchListingStatusPayload,
): Promise<unknown> {
  const base = getApiUrl();
  if (!base) {
    throw new ListingsApiError('API URL is not configured', 0);
  }
  const res = await fetch(`${base}/api/listings/${encodeURIComponent(listingId)}/status`, {
    method: 'PATCH',
    headers: {
      ...jsonHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new ListingsApiError(messageFromBody(data) || 'Request failed', res.status);
  }
  return (data as { listing?: unknown }).listing ?? data;
}

export async function fetchListingBySlug(slug: string): Promise<ListingDetailDto> {
  const base = getApiUrl();
  if (!base) {
    throw new ListingsApiError('API URL is not configured', 0);
  }
  const res = await fetch(
    `${base}/api/listings/${encodeURIComponent(slug)}`,
    { headers: jsonHeaders(), credentials: 'include' },
  );
  const body = (await parseJson(res)) as { listing?: ListingDetailDto } | null;
  if (!res.ok) {
    throw new ListingsApiError('Failed to load listing', res.status);
  }
  if (!body?.listing) {
    throw new ListingsApiError('Listing not found', res.status);
  }
  return body.listing;
}
