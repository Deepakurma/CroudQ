export type YoutubeVideosListResponse = {
  items?: Array<{
    id?: string;
    contentDetails?: {
      duration?: string;
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      favoriteCount?: string;
      commentCount?: string;
    };
  }>;
};

export type YoutubeAnalyticsReportsResponse = {
  columnHeaders?: Array<{
    name?: string;
  }>;
  rows?: Array<Array<string | number>>;
};

export type VideoDetails = {
  viewCount: number | null;
  likeCount: number | null;
  favoriteCount: number | null;
  commentCount: number | null;
  duration: string | null;
};

export type VideoAnalytics = {
  analyticsViews: number | null;
  analyticsLikes: number | null;
  analyticsComments: number | null;
  analyticsShares: number | null;
  estimatedMinutesWatched: number | null;
  averageViewDuration: number | null;
  subscribersGained: number | null;
  subscribersLost: number | null;
};

export type FetchYoutubeJson = <T>(path: string, accessToken: string) => Promise<T>;

export type VideoSummaryInput = {
  id: string;
  youtubeVideoId: string;
  title: string;
  publishedAt: Date | null;
  thumbnailUrl: string | null;
  viewCount: number | null;
  likeCount: number | null;
  favoriteCount: number | null;
  commentCount: number | null;
  duration: string | null;
  analyticsViews: number | null;
  analyticsLikes: number | null;
  analyticsComments: number | null;
  analyticsShares: number | null;
  estimatedMinutesWatched: number | null;
  averageViewDuration: number | null;
  subscribersGained: number | null;
  subscribersLost: number | null;
};
