import { createTRPCRouter, protectedProcedure } from "../../server/trpc";
import {
  getStoredInsightState,
  refreshYoutubeInsightsForUser,
} from "../../modules/insights/controller";
import {
  refreshInsightResponseSchema,
  insightStateResponseSchema,
} from "./dto";

export const insightsRouter = createTRPCRouter({
  insight: protectedProcedure.query(async ({ ctx }) =>
    insightStateResponseSchema.parse(
      await getStoredInsightState({
        userId: ctx.user.userId,
      }),
    ),
  ),
  refresh: protectedProcedure.mutation(async ({ ctx }) =>
    refreshInsightResponseSchema.parse(
      await refreshYoutubeInsightsForUser({
        userId: ctx.user.userId,
        forceRefresh: true,
      }),
    ),
  ),
});
