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
  cursor: z
    .object({
      publishedAt: z.string(),
      id: z.string().uuid(),
    })
    .nullish(),
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
  updatedAt: z.date(),
});

export const youtubeDataResponseSchema = z.object({
  channel: z.object({
    id: z.string(),
    title: z.string().nullable(),
  }),
  videos: z.array(youtubeVideoSummarySchema),
  nextCursor: z
    .object({
      publishedAt: z.string(),
      id: z.string().uuid(),
    })
    .nullish(),
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
