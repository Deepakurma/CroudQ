import { createTRPCRouter, protectedProcedure } from "../../server/trpc";
import {
  commentsScope,
  dashboardScope,
  generateVideoInsightOnDemand,
  getInsightArtifact,
  getStoredVideoInsightState,
  refreshYoutubeInsightsForUser,
  strategyScope,
} from "../../modules/insights/controller";
import { toYoutubeTRPCError } from "../../modules/youtube-errors/controller";
import {
  commentsInsightResponseSchema,
  dashboardInsightResponseSchema,
  generateVideoInsightResponseSchema,
  strategyInsightResponseSchema,
  videoInsightParamsSchema,
  videoInsightStateResponseSchema,
} from "./dto";

export const insightsRouter = createTRPCRouter({
  dashboard: protectedProcedure.query(async ({ ctx }) =>
    dashboardInsightResponseSchema.parse(
      await getInsightArtifact({
        userId: ctx.user.id,
        scope: dashboardScope,
      }),
    ),
  ),
  comments: protectedProcedure.query(async ({ ctx }) =>
    commentsInsightResponseSchema.parse(
      await getInsightArtifact({
        userId: ctx.user.id,
        scope: commentsScope,
      }),
    ),
  ),
  strategy: protectedProcedure.query(async ({ ctx }) =>
    strategyInsightResponseSchema.parse(
      await getInsightArtifact({
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
