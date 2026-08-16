import { createTRPCRouter, protectedProcedure } from "../../server/trpc";
import { getStoredInsightState } from "../../modules/insights/controller";
import z from "zod";

export const insightsRouter = createTRPCRouter({
  insight: protectedProcedure
    .input(z.object({ forceRefresh: z.boolean() }))
    .mutation(
      async ({ ctx, input }) =>
        await getStoredInsightState({
          userId: ctx.user.userId,
          forceRefresh: input.forceRefresh,
        }),
    ),
});
