import { z } from "zod";

import { youtubePerformanceComparisonSchema } from "../../modules/overviewstats/dto";

export const youtubeAuthUrlQuerySchema = z.object({
  redirectTo: z.url().optional(),
});

export const youtubeCallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export const youtubeDataParamsSchema = z.object({});

export const youtubeSyncParamsSchema = z.object({});

export const youtubeVideoSummarySchema = z.object({
  id: z.string(),
  youtubeVideoId: z.string(),
  title: z.string(),
  publishedAt: z.date().nullable(),
  thumbnailUrl: z.string().nullable(),
  viewCount: z.number().int().nonnegative().nullable(),
  likeCount: z.number().int().nonnegative().nullable(),
  favoriteCount: z.number().int().nonnegative().nullable(),
  commentCount: z.number().int().nonnegative().nullable(),
  duration: z.string().nullable(),
  analyticsViews: z.number().int().nonnegative().nullable(),
  analyticsLikes: z.number().int().nonnegative().nullable(),
  analyticsComments: z.number().int().nonnegative().nullable(),
  analyticsShares: z.number().int().nonnegative().nullable(),
  estimatedMinutesWatched: z.number().int().nonnegative().nullable(),
  averageViewDuration: z.number().int().nonnegative().nullable(),
  subscribersGained: z.number().int().nonnegative().nullable(),
  subscribersLost: z.number().int().nonnegative().nullable(),
});

export const youtubeDataResponseSchema = z.object({
  channel: z.object({
    id: z.string(),
    title: z.string().nullable(),
  }),
  videos: z.array(youtubeVideoSummarySchema),
  commentsCount: z.number().int().nonnegative(),
  lastSyncedAt: z.date().nullable(),
  performanceComparison: youtubePerformanceComparisonSchema.nullable(),
});

export type YoutubeAuthUrlQuery = z.infer<typeof youtubeAuthUrlQuerySchema>;
export type YoutubeCallbackQuery = z.infer<typeof youtubeCallbackQuerySchema>;
export type YoutubeDataParams = z.infer<typeof youtubeDataParamsSchema>;
export type YoutubeSyncParams = z.infer<typeof youtubeSyncParamsSchema>;
export type YoutubeDataResponse = z.infer<typeof youtubeDataResponseSchema>;
