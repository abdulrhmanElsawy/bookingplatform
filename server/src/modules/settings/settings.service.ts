import { SiteSettings } from './siteSettings.model.js';

export type SiteSettingsDto = {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  reviewsRequireModeration: boolean;
  defaultLanguage: 'ar' | 'en';
  announcementBanner?: { ar?: string; en?: string };
  updatedAt: string;
};

function toDto(doc: {
  maintenanceMode?: boolean;
  allowRegistration?: boolean;
  reviewsRequireModeration?: boolean;
  defaultLanguage?: string;
  announcementBanner?: { ar?: string; en?: string };
  updatedAt?: Date | string;
}): SiteSettingsDto {
  return {
    maintenanceMode: Boolean(doc.maintenanceMode),
    allowRegistration: doc.allowRegistration !== false,
    reviewsRequireModeration: Boolean(doc.reviewsRequireModeration),
    defaultLanguage: doc.defaultLanguage === 'en' ? 'en' : 'ar',
    announcementBanner: doc.announcementBanner,
    updatedAt:
      doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt ?? ''),
  };
}

export async function getOrCreateSiteSettings(): Promise<SiteSettingsDto> {
  let doc = await SiteSettings.findOne().lean();
  if (!doc) {
    const created = await SiteSettings.create({});
    doc = created.toObject();
  }
  return toDto(doc as Parameters<typeof toDto>[0]);
}

export async function patchSiteSettings(body: Partial<{
  maintenanceMode: boolean;
  allowRegistration: boolean;
  reviewsRequireModeration: boolean;
  defaultLanguage: 'ar' | 'en';
  announcementBanner: { ar?: string; en?: string } | null;
}>): Promise<SiteSettingsDto> {
  let doc = await SiteSettings.findOne();
  if (!doc) {
    doc = await SiteSettings.create({});
  }
  if (body.maintenanceMode !== undefined) doc.maintenanceMode = body.maintenanceMode;
  if (body.allowRegistration !== undefined) doc.allowRegistration = body.allowRegistration;
  if (body.reviewsRequireModeration !== undefined) {
    doc.reviewsRequireModeration = body.reviewsRequireModeration;
  }
  if (body.defaultLanguage !== undefined) doc.defaultLanguage = body.defaultLanguage;
  if (body.announcementBanner !== undefined) {
    doc.announcementBanner =
      body.announcementBanner === null ? undefined : body.announcementBanner;
  }
  await doc.save();
  return toDto(doc.toObject());
}

export async function getPublicSiteSettings(): Promise<{
  maintenanceMode: boolean;
  announcementBanner?: { ar?: string; en?: string };
}> {
  const s = await getOrCreateSiteSettings();
  return {
    maintenanceMode: s.maintenanceMode,
    announcementBanner: s.announcementBanner,
  };
}

export async function reviewsRequireModeration(): Promise<boolean> {
  const s = await getOrCreateSiteSettings();
  return s.reviewsRequireModeration;
}
