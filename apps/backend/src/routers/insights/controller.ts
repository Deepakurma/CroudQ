import { createTRPCRouter, protectedProcedure } from "../../server/trpc";
import {
  commentsScope,
  generateVideoInsightOnDemand,
  getStoredAggregateInsightState,
  getStoredVideoInsightState,
  refreshYoutubeInsightsForUser,
  dashboardScope,
  strategyScope,
} from "../../modules/insights/controller";
import { toYoutubeTRPCError } from "../../modules/youtube-errors/controller";
import {
  commentsInsightStateResponseSchema,
  dashboardInsightStateResponseSchema,
  generateVideoInsightResponseSchema,
  strategyInsightStateResponseSchema,
  videoInsightParamsSchema,
  videoInsightStateResponseSchema,
} from "./dto";

export const insightsRouter = createTRPCRouter({
  dashboard: protectedProcedure.query(async ({ ctx }) =>
    dashboardInsightStateResponseSchema.parse(
      await getStoredAggregateInsightState({
        userId: ctx.user.id,
        scope: dashboardScope,
      }),
    ),
  ),
  comments: protectedProcedure.query(async ({ ctx }) =>
    commentsInsightStateResponseSchema.parse(
      await getStoredAggregateInsightState({
        userId: ctx.user.id,
        scope: commentsScope,
      }),
    ),
  ),
  strategy: protectedProcedure.query(async ({ ctx }) =>
    strategyInsightStateResponseSchema.parse(
      await getStoredAggregateInsightState({
        userId: ctx.user.id,
        scope: strategyScope,
      }),
    ),
  ),
  video: protectedProcedure
    .input(videoInsightParamsSchema)
    .query(async ({ ctx, input }) =>
      videoInsightStateResponseSchema.parse(
        await getStoredVideoInsightState({
          userId: ctx.user.id,
          videoId: input.videoId,
        }),
      ),
    ),
  refreshAll: protectedProcedure.mutation(async ({ ctx }) =>
    Promise.all(
      (
        await refreshYoutubeInsightsForUser({
          userId: ctx.user.id,
          forceRefresh: true,
        })
      ).map((artifact) => artifact),
    ),
  ),
  refreshVideo: protectedProcedure
    .input(videoInsightParamsSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return generateVideoInsightResponseSchema.parse(
          await generateVideoInsightOnDemand({
            userId: ctx.user.id,
            videoId: input.videoId,
          }),
        );
      } catch (error) {
        throw toYoutubeTRPCError(error);
      }
    }),
});
