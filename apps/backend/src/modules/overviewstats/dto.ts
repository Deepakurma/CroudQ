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

export type DashboardOverviewStat = {
  id: string;
  label: string;
  value: string;
  delta: string;
};
