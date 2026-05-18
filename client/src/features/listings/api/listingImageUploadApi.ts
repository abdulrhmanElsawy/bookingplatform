import { getApiUrl } from '../../../config/publicEnv';
import i18n from '../../../i18n';

export class ListingImageUploadError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ListingImageUploadError';
  }
}

function acceptLanguageHeader(): string {
  const lng = i18n.language?.toLowerCase() ?? 'ar';
  return lng.startsWith('en') ? 'en' : 'ar';
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

export type UploadedListingImage = {
  url: string;
  publicId: string;
  alt: { ar: string; en: string };
};

export async function uploadListingImage(
  file: File,
  alt: { ar: string; en: string },
): Promise<UploadedListingImage> {
  const form = new FormData();
  form.append('file', file);
  form.append('altAr', alt.ar.trim());
  form.append('altEn', alt.en.trim());

  const res = await fetch(`${getApiUrl()}/api/uploads/listing-image`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Accept-Language': acceptLanguageHeader(),
    },
    body: form,
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const msg = messageFromBody(body) || res.statusText || 'Upload failed';
    throw new ListingImageUploadError(msg, res.status);
  }

  const image =
    body &&
    typeof body === 'object' &&
    'image' in body &&
    body.image &&
    typeof body.image === 'object'
      ? (body.image as Record<string, unknown>)
      : null;

  const url = typeof image?.url === 'string' ? image.url : '';
  const publicId = typeof image?.publicId === 'string' ? image.publicId : '';
  const altObj =
    image?.alt && typeof image.alt === 'object'
      ? (image.alt as Record<string, unknown>)
      : null;
  const ar = typeof altObj?.ar === 'string' ? altObj.ar : alt.ar;
  const en = typeof altObj?.en === 'string' ? altObj.en : alt.en;

  if (!url) {
    throw new ListingImageUploadError('Invalid response', res.status);
  }

  return { url, publicId, alt: { ar, en } };
}
