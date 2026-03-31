import { z } from "zod";

export const adminDashboardOverviewSchema = z.object({
  totalCreators: z.number().int().nonnegative(),
  connectedCreators: z.number().int().nonnegative(),
  conversionRate: z.number().nonnegative(),
  totalFeedbacks: z.number().int().nonnegative(),
});

const creatorJoinPeriodSchema = z.object({
  current: z.number().int().nonnegative(),
  previous: z.number().int().nonnegative(),
});

export const adminDashboardCreatorJoinsSchema = z.object({
  today: creatorJoinPeriodSchema,
  week: creatorJoinPeriodSchema,
  month: creatorJoinPeriodSchema,
});
