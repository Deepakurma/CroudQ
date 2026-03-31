import type {
  FetchYoutubeJson,
  VideoAnalytics,
  VideoDetails,
  VideoSummaryInput,
  YoutubeAnalyticsReportsResponse,
  YoutubeVideosListResponse,
} from "./dto";

const YOUTUBE_ANALYTICS_API_URL = "https://youtubeanalytics.googleapis.com/v2";

export const fetchVideoDetailsByIds = async (
  youtubeVideoIds: string[],
  accessToken: string,
  fetchYoutubeJson: FetchYoutubeJson,
) => {
  if (youtubeVideoIds.length === 0) {
    return new Map<string, VideoDetails>();
  }

  const response = await fetchYoutubeJson<YoutubeVideosListResponse>(
    `/videos?part=contentDetails,statistics&id=${encodeURIComponent(
      youtubeVideoIds.join(","),
    )}`,
    accessToken,
  );

  return new Map(
    (response.items || []).map((item) => [
      item.id || "",
      {
        viewCount: item.statistics?.viewCount
          ? Number(item.statistics.viewCount)
          : null,
        likeCount: item.statistics?.likeCount
          ? Number(item.statistics.likeCount)
          : null,
        favoriteCount: item.statistics?.favoriteCount
          ? Number(item.statistics.favoriteCount)
          : null,
        commentCount: item.statistics?.commentCount
          ? Number(item.statistics.commentCount)
          : null,
        duration: item.contentDetails?.duration || null,
      },
    ]),
  );
};

export const fetchVideoAnalyticsByIds = async (
  youtubeVideoIds: string[],
  accessToken: string,
  fetchAuthorizedJson: <T>(url: string, accessToken: string) => Promise<T>,
) => {
  if (youtubeVideoIds.length === 0) {
    return new Map<string, VideoAnalytics>();
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 27);

  const params = new URLSearchParams({
    ids: "channel==MINE",
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    metrics: [
      "views",
      "likes",
      "comments",
      "shares",
      "estimatedMinutesWatched",
      "averageViewDuration",
      "subscribersGained",
      "subscribersLost",
    ].join(","),
    dimensions: "video",
    filters: `video==${youtubeVideoIds.join(",")}`,
    maxResults: String(youtubeVideoIds.length),
  });

  try {
    const response = await fetchAuthorizedJson<YoutubeAnalyticsReportsResponse>(
      `${YOUTUBE_ANALYTICS_API_URL}/reports?${params.toString()}`,
      accessToken,
    );

    const headers = response.columnHeaders || [];
    const rows = response.rows || [];
    const getIndex = (name: string) =>
      headers.findIndex((header) => header.name === name);

    const videoIndex = getIndex("video");
    const viewsIndex = getIndex("views");
    const likesIndex = getIndex("likes");
    const commentsIndex = getIndex("comments");
    const sharesIndex = getIndex("shares");
    const minutesIndex = getIndex("estimatedMinutesWatched");
    const avgViewDurationIndex = getIndex("averageViewDuration");
    const subscribersGainedIndex = getIndex("subscribersGained");
    const subscribersLostIndex = getIndex("subscribersLost");

    return new Map(
      rows
        .map((row) => {
          const youtubeVideoId =
            videoIndex >= 0 ? String(row[videoIndex] || "") : "";

          if (!youtubeVideoId) {
            return null;
          }

          const getMetric = (index: number) => {
            if (index < 0) return null;
            const value = row[index];
            if (value === undefined || value === null || value === "") {
              return null;
            }

            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
          };

          return [
            youtubeVideoId,
            {
              analyticsViews: getMetric(viewsIndex),
              analyticsLikes: getMetric(likesIndex),
              analyticsComments: getMetric(commentsIndex),
              analyticsShares: getMetric(sharesIndex),
              estimatedMinutesWatched: getMetric(minutesIndex),
              averageViewDuration: getMetric(avgViewDurationIndex),
              subscribersGained: getMetric(subscribersGainedIndex),
              subscribersLost: getMetric(subscribersLostIndex),
            },
          ] as const;
        })
        .filter(
          (
            entry,
          ): entry is readonly [string, VideoAnalytics] => Boolean(entry),
        ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isScopeIssue =
      message.includes("403") ||
      message.includes("insufficientPermissions") ||
      message.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT");

    if (isScopeIssue) {
      return new Map<string, VideoAnalytics>();
    }

    throw error;
  }
};

export const buildVideoSummary = (video: VideoSummaryInput) => ({
  id: video.id,
  youtubeVideoId: video.youtubeVideoId,
  title: video.title,
  publishedAt: video.publishedAt,
  thumbnailUrl: video.thumbnailUrl,
  viewCount: video.viewCount ?? null,
  likeCount: video.likeCount ?? null,
  favoriteCount: video.favoriteCount ?? null,
  commentCount: video.commentCount ?? null,
  duration: video.duration ?? null,
  analyticsViews: video.analyticsViews ?? null,
  analyticsLikes: video.analyticsLikes ?? null,
  analyticsComments: video.analyticsComments ?? null,
  analyticsShares: video.analyticsShares ?? null,
  estimatedMinutesWatched: video.estimatedMinutesWatched ?? null,
  averageViewDuration: video.averageViewDuration ?? null,
  subscribersGained: video.subscribersGained ?? null,
  subscribersLost: video.subscribersLost ?? null,
});
