import { z } from "zod";

export const billingPlanSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  currency: z.string(),
  amount: z.number().int(),
  amountLabel: z.string(),
  interval: z.number().int(),
  period: z.string(),
  tier: z.string(),
});

export const currentSubscriptionSchema = z.object({
  planCode: z.string().nullable(),
  planName: z.string().nullable(),
  status: z.string(),
  tier: z.string().nullable(),
  currentPeriodEndsAt: z.string().datetime().nullable(),
  cancelAtCycleEnd: z.boolean(),
});

export const billingOverviewSchema = z.object({
  plans: z.array(billingPlanSchema),
  currentSubscription: currentSubscriptionSchema.nullable(),
});

export const createCheckoutSessionInputSchema = z.object({
  planCode: z.string().min(1),
});

export const createCheckoutSessionSchema = z.object({
  keyId: z.string(),
  subscriptionId: z.string(),
  plan: z.object({
    code: z.string(),
    name: z.string(),
    amount: z.number().int(),
    currency: z.string(),
  }),
  prefill: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  existing: z.boolean(),
  recovery: z.boolean(),
});

export const verifyCheckoutInputSchema = z.object({
  planCode: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySubscriptionId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const verifyCheckoutSchema = z.object({
  success: z.literal(true),
  status: z.string(),
});
