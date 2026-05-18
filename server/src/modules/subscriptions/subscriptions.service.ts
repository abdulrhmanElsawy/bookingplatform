import crypto from 'node:crypto';
import type { Types } from 'mongoose';
import mongoose from 'mongoose';

import { translate } from '../../lib/i18n.js';
import { httpError } from '../../middleware/errorHandler.js';
import { sendSubscriptionConfirmedEmail } from '../email/email.service.js';
import type { PackageDuration } from '../listings/listing.model.js';
import { Listing } from '../listings/listing.model.js';
import { createNotification } from '../notifications/notifications.service.js';
import { User } from '../users/user.model.js';

import {
  VenueSubscription,
  type SubscriptionStatus,
} from './venueSubscription.model.js';

const ACCESS_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateAccessCode(): string {
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += ACCESS_CODE_CHARS[crypto.randomInt(ACCESS_CODE_CHARS.length)]!;
  }
  return `GW-${suffix}`;
}

export function computeValidUntil(from: Date, duration: PackageDuration): Date {
  const end = new Date(from);
  switch (duration) {
    case 'day':
      end.setDate(end.getDate() + 1);
      break;
    case 'week':
      end.setDate(end.getDate() + 7);
      break;
    case 'month':
      end.setMonth(end.getMonth() + 1);
      break;
    case 'quarter':
      end.setMonth(end.getMonth() + 3);
      break;
    case 'year':
      end.setFullYear(end.getFullYear() + 1);
      break;
    default:
      end.setMonth(end.getMonth() + 1);
  }
  return end;
}

function resolveStatus(validUntil: Date, stored: SubscriptionStatus): SubscriptionStatus {
  if (stored === 'cancelled') return 'cancelled';
  if (validUntil.getTime() < Date.now()) return 'expired';
  return stored === 'active' ? 'active' : stored;
}

export type VenueSubscriptionPublic = {
  id: string;
  accessCode: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  validFrom: string;
  validUntil: string;
  packageSnapshot: {
    name: { ar: string; en: string };
    price: number;
    currency: string;
    duration: string;
  };
  listing: {
    id: string;
    slug: string;
    name: { ar: string; en: string };
  };
  createdAt: string;
};

type ListingWithPackages = {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  slug: string;
  name: { ar: string; en: string };
  status: string;
  packages?: Array<{
    _id: Types.ObjectId;
    name: { ar: string; en: string };
    price: number;
    currency?: string;
    duration: PackageDuration;
    isActive?: boolean;
  }>;
};

function toPublic(
  doc: {
    _id: unknown;
    accessCode: string;
    status: SubscriptionStatus;
    amount: number;
    currency?: string;
    validFrom: Date;
    validUntil: Date;
    packageSnapshot: VenueSubscriptionPublic['packageSnapshot'];
    createdAt?: Date;
  },
  listing: { _id: unknown; slug: string; name: { ar: string; en: string } },
): VenueSubscriptionPublic {
  const status = resolveStatus(doc.validUntil, doc.status);
  return {
    id: String(doc._id),
    accessCode: doc.accessCode,
    status,
    amount: doc.amount,
    currency: doc.currency ?? 'SAR',
    validFrom: doc.validFrom.toISOString(),
    validUntil: doc.validUntil.toISOString(),
    packageSnapshot: doc.packageSnapshot,
    listing: {
      id: String(listing._id),
      slug: listing.slug,
      name: listing.name,
    },
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date().toISOString(),
  };
}

async function createUniqueAccessCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateAccessCode();
    const exists = await VenueSubscription.exists({ accessCode: code });
    if (!exists) return code;
  }
  throw httpError(500, 'Could not generate access code');
}

async function notifySubscriptionCreated(
  memberId: string,
  ownerId: string,
  venueName: { ar: string; en: string },
  accessCode: string,
  listingId: string,
  slug: string,
): Promise<void> {
  try {
    await createNotification({
      userId: memberId,
      type: 'new_booking',
      title: {
        ar: translate('ar', 'notifVenueSubscriptionMemberTitle'),
        en: translate('en', 'notifVenueSubscriptionMemberTitle'),
      },
      body: {
        ar: translate('ar', 'notifVenueSubscriptionMemberBody', {
          name: venueName.ar,
          code: accessCode,
        }),
        en: translate('en', 'notifVenueSubscriptionMemberBody', {
          name: venueName.en,
          code: accessCode,
        }),
      },
      metadata: { listingId, slug, accessCode },
    });
    await createNotification({
      userId: ownerId,
      type: 'new_booking',
      title: {
        ar: translate('ar', 'notifVenueSubscriptionOwnerTitle'),
        en: translate('en', 'notifVenueSubscriptionOwnerTitle'),
      },
      body: {
        ar: translate('ar', 'notifVenueSubscriptionOwnerBody', {
          name: venueName.ar,
          code: accessCode,
        }),
        en: translate('en', 'notifVenueSubscriptionOwnerBody', {
          name: venueName.en,
          code: accessCode,
        }),
      },
      metadata: { listingId, slug, accessCode },
    });
  } catch (err) {
    console.error('notifySubscriptionCreated failed', err);
  }
}

export async function simulateVenueSubscription(
  userId: string,
  listingSlug: string,
  packageId: string,
): Promise<VenueSubscriptionPublic> {
  const listing = (await Listing.findOne({ slug: listingSlug.toLowerCase().trim() }).lean()) as
    | ListingWithPackages
    | null;
  if (!listing || listing.status !== 'active') {
    throw httpError(404, 'Listing not found');
  }

  if (!mongoose.Types.ObjectId.isValid(packageId)) {
    throw httpError(400, 'Invalid package');
  }
  const pkgOid = new mongoose.Types.ObjectId(packageId);
  const pkg = listing.packages?.find((p) => p._id.equals(pkgOid));
  if (!pkg || pkg.isActive === false) {
    throw httpError(404, 'Package not found');
  }

  const user = await User.findById(userId)
    .select('email firstName preferences')
    .lean<{ email: string; firstName: string; preferences?: { language?: string } }>();
  if (!user) {
    throw httpError(404, 'User not found');
  }

  const validFrom = new Date();
  const validUntil = computeValidUntil(validFrom, pkg.duration);
  const accessCode = await createUniqueAccessCode();
  const amount = pkg.price;
  const currency = pkg.currency ?? 'SAR';
  const simulatedPaymentRef = `SIM-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const doc = await VenueSubscription.create({
    user: userId,
    listing: listing._id,
    packageId: pkg._id,
    packageSnapshot: {
      name: pkg.name,
      price: pkg.price,
      currency,
      duration: pkg.duration,
    },
    accessCode,
    status: 'active',
    amount,
    currency,
    validFrom,
    validUntil,
    simulatedPaymentRef,
  });

  void notifySubscriptionCreated(
    userId,
    String(listing.owner),
    listing.name,
    accessCode,
    String(listing._id),
    listing.slug,
  );

  void sendSubscriptionConfirmedEmail(
    {
      email: String(user.email),
      firstName: String(user.firstName),
      preferences: {
        language:
          user.preferences?.language === 'en' || user.preferences?.language === 'ar'
            ? user.preferences.language
            : 'ar',
      },
    },
    String(amount),
    currency,
    accessCode,
    listing.name.en,
  ).catch((err) => console.error('sendSubscriptionConfirmedEmail failed', err));

  return toPublic(doc.toObject(), listing);
}

export async function listMyVenueSubscriptions(
  userId: string,
  page: number,
  limit: number,
): Promise<{
  subscriptions: VenueSubscriptionPublic[];
  total: number;
  page: number;
  limit: number;
}> {
  const filter = { user: userId };
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    VenueSubscription.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate<{ listing: { _id: unknown; slug: string; name: { ar: string; en: string } } }>(
        'listing',
        'slug name',
      )
      .lean(),
    VenueSubscription.countDocuments(filter),
  ]);

  const subscriptions = rows
    .filter((r) => r.listing && typeof r.listing === 'object')
    .map((r) =>
      toPublic(
        {
          _id: r._id,
          accessCode: r.accessCode,
          status: r.status as SubscriptionStatus,
          amount: r.amount,
          currency: r.currency,
          validFrom: r.validFrom,
          validUntil: r.validUntil,
          packageSnapshot: r.packageSnapshot as VenueSubscriptionPublic['packageSnapshot'],
          createdAt: r.createdAt,
        },
        r.listing as { _id: unknown; slug: string; name: { ar: string; en: string } },
      ),
    );

  return { subscriptions, total, page, limit };
}

export type VerifyAccessCodeResult =
  | {
      valid: true;
      subscription: {
        memberName: string;
        packageName: { ar: string; en: string };
        validUntil: string;
        status: SubscriptionStatus;
        accessCode: string;
      };
    }
  | { valid: false; reason: string };

export async function verifyAccessCode(
  ownerId: string,
  accessCode: string,
  listingId?: string,
): Promise<VerifyAccessCodeResult> {
  const normalized = accessCode.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, reason: 'invalid' };
  }

  const ownerListings = await Listing.find({ owner: ownerId })
    .select('_id')
    .lean<{ _id: mongoose.Types.ObjectId }[]>();
  const ownerListingIds = ownerListings.map((l) => l._id);

  if (listingId) {
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return { valid: false, reason: 'invalid_listing' };
    }
    const lid = new mongoose.Types.ObjectId(listingId);
    if (!ownerListingIds.some((id) => id.equals(lid))) {
      return { valid: false, reason: 'forbidden' };
    }
  }

  const listingFilter =
    listingId && mongoose.Types.ObjectId.isValid(listingId)
      ? { listing: new mongoose.Types.ObjectId(listingId) }
      : { listing: { $in: ownerListingIds } };

  const sub = await VenueSubscription.findOne({
    accessCode: normalized,
    ...listingFilter,
  })
    .populate<{ user: { firstName: string; lastName: string } }>('user', 'firstName lastName')
    .lean();

  if (!sub) {
    return { valid: false, reason: 'not_found' };
  }

  const status = resolveStatus(sub.validUntil, sub.status as SubscriptionStatus);
  if (status !== 'active') {
    return { valid: false, reason: status === 'expired' ? 'expired' : 'inactive' };
  }

  const user = sub.user as { firstName: string; lastName: string } | null;
  const memberName = user
    ? `${user.firstName} ${user.lastName}`.trim() || 'Member'
    : 'Member';

  return {
    valid: true,
    subscription: {
      memberName,
      packageName: sub.packageSnapshot.name as { ar: string; en: string },
      validUntil: sub.validUntil.toISOString(),
      status,
      accessCode: sub.accessCode,
    },
  };
}
