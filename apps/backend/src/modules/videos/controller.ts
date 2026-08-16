import type {
  FetchYoutubeJson,
  VideoDetails,
  VideoSummaryInput,
  YoutubeVideosListResponse,
} from "./dto";

export const fetchVideoDetailsByIds = async (
  youtubeVideoIds: string[],
  accessToken: string,
  fetchYoutubeJson: FetchYoutubeJson,
) => {
  if (youtubeVideoIds.length === 0) {
    return new Map<string, VideoDetails>();
  }

  const response = (await fetchYoutubeJson(
    `/videos?part=contentDetails,statistics&id=${encodeURIComponent(
      youtubeVideoIds.join(","),
    )}`,
    accessToken,
  )) as YoutubeVideosListResponse;

  // Tranforms into key value pairs
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
  updatedAt: video.updatedAt,
});
