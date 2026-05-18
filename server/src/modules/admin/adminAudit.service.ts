import { AdminAuditLog } from './adminAuditLog.model.js';

export async function logAdminAudit(entry: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await AdminAuditLog.create({
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    console.error('logAdminAudit failed', err);
  }
}

export type AdminAuditRow = {
  _id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export async function listAdminAudit(options: {
  page: number;
  limit: number;
  action?: string;
}): Promise<{
  entries: AdminAuditRow[];
  total: number;
  page: number;
  limit: number;
}> {
  const filter: Record<string, unknown> = {};
  if (options.action?.trim()) {
    filter.action = options.action.trim();
  }
  const skip = (options.page - 1) * options.limit;
  const [rows, total] = await Promise.all([
    AdminAuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(options.limit).lean(),
    AdminAuditLog.countDocuments(filter),
  ]);
  return {
    entries: rows.map((r) => ({
      _id: String(r._id),
      actorId: String(r.actorId),
      action: String(r.action),
      targetType: String(r.targetType),
      targetId: r.targetId != null ? String(r.targetId) : '',
      metadata: (r.metadata as Record<string, unknown>) ?? {},
      createdAt:
        r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    })),
    total,
    page: options.page,
    limit: options.limit,
  };
}
