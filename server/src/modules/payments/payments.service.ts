import { translate } from '../../lib/i18n.js';
import { createNotification } from '../notifications/notifications.service.js';

import {
  SimulatedPayment,
  SIMULATED_PLAN_KEYS,
  type SimulatedPlanKey,
} from './payment.model.js';

export const PLAN_PRICES_SAR: Record<SimulatedPlanKey, number> = {
  free: 0,
  basic: 99,
  pro: 199,
  enterprise: 499,
};

export type PlanCatalogRow = { key: SimulatedPlanKey; price: number; currency: string };

export function getPlanCatalog(): PlanCatalogRow[] {
  return SIMULATED_PLAN_KEYS.map((key) => ({
    key,
    price: PLAN_PRICES_SAR[key],
    currency: 'SAR',
  }));
}

export type SimulatedPaymentPublic = {
  id: string;
  planKey: SimulatedPlanKey;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

function toPublic(doc: {
  _id: unknown;
  planKey: string;
  amount: number;
  currency?: string;
  status: string;
  createdAt?: Date;
}): SimulatedPaymentPublic {
  return {
    id: String(doc._id),
    planKey: doc.planKey as SimulatedPlanKey,
    amount: doc.amount,
    currency: doc.currency ?? 'SAR',
    status: doc.status,
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
  };
}

async function notifyPaymentReceived(
  userId: string,
  planKey: SimulatedPlanKey,
  amount: number,
): Promise<void> {
  if (amount <= 0) return;
  try {
    await createNotification({
      userId,
      type: 'payment_received',
      title: {
        ar: translate('ar', 'notifPaymentReceivedTitle'),
        en: translate('en', 'notifPaymentReceivedTitle'),
      },
      body: {
        ar: translate('ar', 'notifPaymentReceivedBody', { amount, plan: planKey }),
        en: translate('en', 'notifPaymentReceivedBody', { amount, plan: planKey }),
      },
      metadata: { planKey, amount, currency: 'SAR' },
    });
  } catch (err) {
    console.error('notifyPaymentReceived failed', err);
  }
}

export async function simulatePlanCheckout(
  userId: string,
  planKey: SimulatedPlanKey,
): Promise<SimulatedPaymentPublic> {
  const amount = PLAN_PRICES_SAR[planKey];
  const doc = await SimulatedPayment.create({
    user: userId,
    planKey,
    amount,
    currency: 'SAR',
    status: 'simulated',
  });
  const row = doc.toObject();
  void notifyPaymentReceived(userId, planKey, amount);
  return toPublic(row);
}

export async function listMySimulatedPayments(
  userId: string,
  page: number,
  limit: number,
): Promise<{
  transactions: SimulatedPaymentPublic[];
  total: number;
  page: number;
  limit: number;
}> {
  const filter = { user: userId };
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    SimulatedPayment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SimulatedPayment.countDocuments(filter),
  ]);
  return {
    transactions: rows.map((r) =>
      toPublic({
        _id: r._id,
        planKey: String(r.planKey),
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt,
      }),
    ),
    total,
    page,
    limit,
  };
}
