import { z } from "zod";

export type StoredVideoMetrics = {
  id: string;
  youtubeVideoId: string;
  title: string;
  publishedAt: Date | null;
  duration: string | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  analyticsViews: number | null;
  analyticsLikes: number | null;
  analyticsComments: number | null;
  analyticsShares: number | null;
  estimatedMinutesWatched: number | null;
  averageViewDuration: number | null;
  subscribersGained: number | null;
  subscribersLost: number | null;
};

export const youtubeVideoPerformanceSnapshotSchema = z.object({
  videoId: z.string(),
  youtubeVideoId: z.string(),
  title: z.string(),
  publishedAt: z.date().nullable(),
  ageHours: z.number().nonnegative(),
  views: z.number().nonnegative(),
  likes: z.number().nonnegative(),
  comments: z.number().nonnegative(),
  shares: z.number().nonnegative(),
  subscribersNet: z.number(),
  viewsPerHour: z.number().nonnegative(),
  likesPerThousandViews: z.number().nonnegative(),
  commentsPerThousandViews: z.number().nonnegative(),
  sharesPerThousandViews: z.number().nonnegative(),
  engagementScore: z.number().nonnegative(),
  retentionRatio: z.number().nonnegative(),
  watchTimePerView: z.number().nonnegative(),
  audienceResponseScore: z.number(),
});

export const youtubePerformanceComparisonSchema = z.object({
  latest: youtubeVideoPerformanceSnapshotSchema,
  previous: youtubeVideoPerformanceSnapshotSchema,
  deltas: z.object({
    viewsPerHourPct: z.number(),
    engagementScorePct: z.number(),
    retentionRatioPct: z.number(),
    audienceResponsePct: z.number(),
    watchTimePerViewPct: z.number(),
  }),
});

export type YoutubePerformanceComparison = z.infer<
  typeof youtubePerformanceComparisonSchema
>;

export type YoutubeVideoPerformanceSnapshot = z.infer<
  typeof youtubeVideoPerformanceSnapshotSchema
>;

export const dashboardOverviewStatSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  delta: z.string(),
});

export type DashboardOverviewStat = z.infer<
  typeof dashboardOverviewStatSchema
>;
