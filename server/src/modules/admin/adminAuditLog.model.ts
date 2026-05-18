import mongoose, { Schema } from 'mongoose';

const AdminAuditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    targetType: { type: String, required: true, trim: true, index: true },
    targetId: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AdminAuditLogSchema.index({ createdAt: -1 });

export const AdminAuditLog =
  mongoose.models.AdminAuditLog ?? mongoose.model('AdminAuditLog', AdminAuditLogSchema);
