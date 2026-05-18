import { z } from 'zod';

import { SIMULATED_PLAN_KEYS } from './payment.model.js';

const planTuple = SIMULATED_PLAN_KEYS as unknown as [string, ...string[]];

export const SimulatePlanBodySchema = z
  .object({
    planKey: z.enum(planTuple),
  })
  .strict();

export type SimulatePlanBody = z.infer<typeof SimulatePlanBodySchema>;
