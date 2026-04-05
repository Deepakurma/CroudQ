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

export type SyncCommentsForVideoInput = {
  videoId: string;
  youtubeVideoId: string;
  commentsPerVideo: number;
};
