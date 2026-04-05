import { z } from "zod";

export const youtubeAuthUrlQuerySchema = z.object({
  redirectTo: z.url().optional(),
});

export const youtubeCallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export const youtubeDataParamsSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().positive().max(25).optional(),
});

export const youtubeSyncParamsSchema = z.object({});
export const youtubeDisconnectResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

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
  isUsedInDashboardAnalysis: z.boolean(),
});

export const youtubeDataResponseSchema = z.object({
  channel: z.object({
    id: z.string(),
    title: z.string().nullable(),
  }),
  videos: z.array(youtubeVideoSummarySchema),
  nextCursor: z.string().nullable(),
  totalVideosCount: z.number().int().nonnegative(),
  commentsCount: z.number().int().nonnegative(),
  lastSyncedAt: z.date().nullable(),
});

export const youtubeSyncResponseSchema = z.object({
  channel: z.object({
    id: z.string(),
    title: z.string().nullable(),
  }),
  videos: z.array(youtubeVideoSummarySchema),
  commentsCount: z.number().int().nonnegative(),
  lastSyncedAt: z.date().nullable(),
});

export type YoutubeAuthUrlQuery = z.infer<typeof youtubeAuthUrlQuerySchema>;
export type YoutubeCallbackQuery = z.infer<typeof youtubeCallbackQuerySchema>;
export type YoutubeDataParams = z.infer<typeof youtubeDataParamsSchema>;
export type YoutubeSyncParams = z.infer<typeof youtubeSyncParamsSchema>;
export type YoutubeDataResponse = z.infer<typeof youtubeDataResponseSchema>;
export type YoutubeSyncResponse = z.infer<typeof youtubeSyncResponseSchema>;
