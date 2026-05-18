import mongoose, { Schema } from 'mongoose';

export const SIMULATED_PLAN_KEYS = ['free', 'basic', 'pro', 'enterprise'] as const;
export type SimulatedPlanKey = (typeof SIMULATED_PLAN_KEYS)[number];

const SimulatedPaymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planKey: {
      type: String,
      required: true,
      enum: SIMULATED_PLAN_KEYS,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'SAR', trim: true },
    status: {
      type: String,
      enum: ['simulated'],
      default: 'simulated',
    },
  },
  { timestamps: true },
);

SimulatedPaymentSchema.index({ user: 1, createdAt: -1 });

export const SimulatedPayment =
  mongoose.models.SimulatedPayment ??
  mongoose.model('SimulatedPayment', SimulatedPaymentSchema);
