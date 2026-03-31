export type YoutubeCommentThreadsResponse = {
  nextPageToken?: string;
  items?: Array<{
    id?: string;
    snippet?: {
      topLevelComment?: {
        id?: string;
        snippet?: {
          textDisplay?: string;
          textOriginal?: string;
          publishedAt?: string;
          likeCount?: number;
        };
      };
    };
  }>;
};

export type FetchYoutubeJson = <T>(path: string, accessToken: string) => Promise<T>;

export type SyncCommentsForVideoInput = {
  videoId: string;
  youtubeVideoId: string;
  accessToken: string;
  commentsPerVideo: number;
  fetchYoutubeJson: FetchYoutubeJson;
};
