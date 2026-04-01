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

export type VideoDetails = {
  viewCount: number | null;
  likeCount: number | null;
  favoriteCount: number | null;
  commentCount: number | null;
  duration: string | null;
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
  isUsedInDashboardAnalysis?: boolean;
};
