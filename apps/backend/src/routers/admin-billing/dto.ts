import { z } from "zod";

const revenuePeriodSchema = z.object({
  current: z.number().int().nonnegative(),
  previous: z.number().int().nonnegative(),
});

export const adminBillingOverviewSchema = z.object({
  summary: z.object({
    totalRevenue: z.number().int().nonnegative(),
    totalSubscriptions: z.number().int().nonnegative(),
    pendingSubscriptions: z.number().int().nonnegative(),
  }),
  revenueStats: z.object({
    today: revenuePeriodSchema,
    week: revenuePeriodSchema,
    month: revenuePeriodSchema,
  }),
  monthlyRevenue: z.array(
    z.object({
      month: z.string().min(1),
      stat: z.number().int().nonnegative(),
    }),
  ),
});
