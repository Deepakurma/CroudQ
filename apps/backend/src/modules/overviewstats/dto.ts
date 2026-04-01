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
};

export const dashboardOverviewStatSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  delta: z.string(),
});

export type DashboardOverviewStat = z.infer<
  typeof dashboardOverviewStatSchema
>;
