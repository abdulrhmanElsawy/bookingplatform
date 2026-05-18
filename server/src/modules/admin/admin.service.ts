import type { AppLang } from '../../lib/i18n.types.js';
import { translate } from '../../lib/i18n.js';
import { isMongoObjectId } from '../../lib/objectId.js';
import { httpError } from '../../middleware/errorHandler.js';
import { bulkCreateSystemAnnouncements } from '../notifications/notifications.service.js';
import { Listing } from '../listings/listing.model.js';
import { Review } from '../reviews/review.model.js';
import type { AdminBroadcastBody, AdminPatchUserBody } from './admin.schemas.js';
import type { UserRole } from '../users/user.model.js';
import { User } from '../users/user.model.js';
import { logAdminAudit } from './adminAudit.service.js';

export type AdminPendingListingRow = {
  _id: string;
  slug: string;
  name: { ar: string; en: string };
  ownerEmail: string;
  status: string;
  createdAt: string;
};

export type AdminUserRow = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
};

export type AdminOverviewDto = {
  totalUsers: number;
  totalListings: number;
  pendingListings: number;
  totalReviews: number;
  pendingReviews: number;
  newUsersToday: number;
  newListingsToday: number;
  actionRequiredCount: number;
  pendingListingRows: AdminPendingListingRow[];
};

function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ELEVATED_ROLES: UserRole[] = ['admin', 'super_admin'];

function isElevatedRole(role: UserRole): boolean {
  return ELEVATED_ROLES.includes(role);
}

export async function listUsersForAdmin(options: {
  page: number;
  limit: number;
  search?: string;
}): Promise<{
  users: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
}> {
  const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
  const q = options.search?.trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ email: rx }, { firstName: rx }, { lastName: rx }];
  }
  const skip = (options.page - 1) * options.limit;
  const [rows, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return {
    users: rows.map((u) => ({
      _id: String(u._id),
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role as UserRole,
      isActive: Boolean(u.isActive),
      isEmailVerified: Boolean(u.isEmailVerified),
      createdAt:
        u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
    })),
    total,
    page: options.page,
    limit: options.limit,
  };
}

export async function patchUserAsAdmin(
  lang: AppLang,
  actorId: string,
  actorRole: UserRole,
  targetUserId: string,
  body: AdminPatchUserBody,
): Promise<AdminUserRow> {
  if (!isMongoObjectId(targetUserId)) {
    throw httpError(404, translate(lang, 'notFound'));
  }

  const target = await User.findOne({
    _id: targetUserId,
    isDeleted: { $ne: true },
  });
  if (!target) {
    throw httpError(404, translate(lang, 'notFound'));
  }

  if (targetUserId === actorId) {
    if (body.isActive === false) {
      throw httpError(400, translate(lang, 'validationError'));
    }
    if (body.role !== undefined) {
      throw httpError(400, translate(lang, 'validationError'));
    }
  }

  if (actorRole === 'admin') {
    if (isElevatedRole(target.role as UserRole)) {
      throw httpError(403, translate(lang, 'forbidden'));
    }
    if (body.role !== undefined && isElevatedRole(body.role as UserRole)) {
      throw httpError(403, translate(lang, 'forbidden'));
    }
  }

  if (body.isActive !== undefined) {
    target.isActive = body.isActive;
  }
  if (body.role !== undefined) {
    target.role = body.role;
  }
  await target.save();

  await logAdminAudit({
    actorId,
    action: 'user.patch',
    targetType: 'user',
    targetId: targetUserId,
    metadata: body as Record<string, unknown>,
  });

  const freshRaw = await User.findById(target._id).select('-password').lean();
  if (!freshRaw || Array.isArray(freshRaw)) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  const fresh = freshRaw as unknown as {
    _id: unknown;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive?: boolean;
    isEmailVerified?: boolean;
    createdAt: Date | string;
  };
  return {
    _id: String(fresh._id),
    email: fresh.email,
    firstName: fresh.firstName,
    lastName: fresh.lastName,
    role: fresh.role,
    isActive: Boolean(fresh.isActive),
    isEmailVerified: Boolean(fresh.isEmailVerified),
    createdAt:
      fresh.createdAt instanceof Date ? fresh.createdAt.toISOString() : String(fresh.createdAt),
  };
}

export async function sendAdminBroadcast(
  body: AdminBroadcastBody,
  actorId?: string,
): Promise<{ recipients: number }> {
  const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (body.scope === 'role' && body.role !== undefined) {
    filter.role = body.role;
  }
  const ids = await User.find(filter).distinct('_id');
  const userIds = ids.map((id) => String(id));
  const recipients = await bulkCreateSystemAnnouncements({
    userIds,
    title: body.title,
    body: body.body,
  });
  if (actorId) {
    await logAdminAudit({
      actorId,
      action: 'broadcast',
      targetType: 'users',
      metadata: { scope: body.scope, role: body.role, recipients },
    });
  }
  return { recipients };
}

export async function getAdminOverview(): Promise<AdminOverviewDto> {
  const dayStart = startOfUtcDay(new Date());

  const userFilter = { isDeleted: { $ne: true } };

  const [
    totalUsers,
    totalListings,
    pendingListings,
    totalReviews,
    pendingReviews,
    newUsersToday,
    newListingsToday,
  ] = await Promise.all([
    User.countDocuments(userFilter),
    Listing.countDocuments(),
    Listing.countDocuments({ status: 'pending' }),
    Review.countDocuments(),
    Review.countDocuments({ status: 'pending' }),
    User.countDocuments({ ...userFilter, createdAt: { $gte: dayStart } }),
    Listing.countDocuments({ createdAt: { $gte: dayStart } }),
  ]);

  const actionRequiredCount = pendingListings + pendingReviews;

  const rawListings = await Listing.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('owner', 'email')
    .select('slug name status createdAt owner')
    .lean();

  const pendingListingRows: AdminPendingListingRow[] = rawListings.map((doc) => {
    const owner = doc.owner as unknown as { email?: string } | null;
    return {
      _id: String(doc._id),
      slug: String(doc.slug),
      name: doc.name as { ar: string; en: string },
      ownerEmail: owner?.email ?? '',
      status: String(doc.status),
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    };
  });

  return {
    totalUsers,
    totalListings,
    pendingListings,
    totalReviews,
    pendingReviews,
    newUsersToday,
    newListingsToday,
    actionRequiredCount,
    pendingListingRows,
  };
}
