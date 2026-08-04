import type {
  DashboardOverviewStat,
  StoredVideoMetrics,
} from "./dto";

const percentDelta = (latest: number, previous: number) => {
  if (!Number.isFinite(latest) || !Number.isFinite(previous)) {
    return null;
  }

  if (previous === 0) {
    return latest === 0 ? 0 : null;
  }

  return ((latest - previous) / Math.abs(previous)) * 100;
};

const formatCompactWholeNumber = (value: number) => {
  if (value >= 1_000_000) {
    return `${Math.round(value / 1_000_000)}M`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }

  return Math.round(value).toString();
};

const formatPercent = (value: number, fractionDigits = 0) =>
  `${value.toFixed(fractionDigits)}%`;

const formatSignedDelta = (
  value: number | null,
  formatter: (next: number) => string,
) => {
  if (value === null || !Number.isFinite(value)) {
    return "New";
  }

  const normalizedValue = Math.max(value, 0);
  const prefix = normalizedValue > 0 ? "+" : "";
  return `${prefix}${formatter(normalizedValue)}`;
};

const getEngagementRate = (video: StoredVideoMetrics) => {
  const views = video.viewCount === null ? null : Math.max(video.viewCount, 0);
  const likes = video.likeCount === null ? null : Math.max(video.likeCount, 0);
  const comments =
    video.commentCount === null ? null : Math.max(video.commentCount, 0);

  if (views === null || likes === null || comments === null) {
    return null;
  }

  if (views <= 0) {
    return 0;
  }

  return ((likes + comments) / views) * 100;
};

export const buildDashboardOverviewStats = (
  sortedVideos: StoredVideoMetrics[],
): DashboardOverviewStat[] => {
  const latestVideo = sortedVideos[0];

  if (!latestVideo) {
    return [
      {
        id: "total_views",
        label: "Total views",
        value: "--",
        delta: "No data",
      },
      {
        id: "total_comments",
        label: "Comments",
        value: "--",
        delta: "No data",
      },
      {
        id: "total_likes",
        label: "Total likes",
        value: "--",
        delta: "No data",
      },
      {
        id: "engagement_rate",
        label: "Engagement",
        value: "--",
        delta: "No data",
      },
    ];
  }

  const previousVideo = sortedVideos[1];
  const latestViews =
    latestVideo.viewCount === null ? null : Math.max(latestVideo.viewCount, 0);
  const latestLikes =
    latestVideo.likeCount === null ? null : Math.max(latestVideo.likeCount, 0);
  const latestComments =
    latestVideo.commentCount === null
      ? null
      : Math.max(latestVideo.commentCount, 0);
  const latestEngagementRate = getEngagementRate(latestVideo);
  const previousViews =
    previousVideo && previousVideo.viewCount !== null
      ? Math.max(previousVideo.viewCount, 0)
      : null;
  const previousLikes =
    previousVideo && previousVideo.likeCount !== null
      ? Math.max(previousVideo.likeCount, 0)
      : null;
  const previousComments =
    previousVideo && previousVideo.commentCount !== null
      ? Math.max(previousVideo.commentCount, 0)
      : null;
  const previousEngagementRate = previousVideo
    ? getEngagementRate(previousVideo)
    : null;

  const viewsDelta =
    latestViews !== null && previousViews !== null
      ? percentDelta(latestViews, previousViews)
      : null;
  const likesDelta =
    latestLikes !== null && previousLikes !== null
      ? percentDelta(latestLikes, previousLikes)
      : null;
  const commentsDelta =
    latestComments !== null && previousComments !== null
      ? percentDelta(latestComments, previousComments)
      : null;
  const engagementDelta =
    latestEngagementRate !== null && previousEngagementRate !== null
      ? percentDelta(latestEngagementRate, previousEngagementRate)
      : null;

  return [
    {
      id: "total_views",
      label: "Total views",
      value:
        latestViews === null
          ? "--"
          : formatCompactWholeNumber(latestViews),
      delta:
        latestViews === null
          ? "No data"
          : formatSignedDelta(viewsDelta, (value) => formatPercent(value, 0)),
    },
    {
      id: "total_comments",
      label: "Comments",
      value:
        latestComments === null
          ? "--"
          : formatCompactWholeNumber(latestComments),
      delta:
        latestComments === null
          ? "No data"
          : formatSignedDelta(commentsDelta, (value) => formatPercent(value, 0)),
    },
    {
      id: "total_likes",
      label: "Total likes",
      value:
        latestLikes === null
          ? "--"
          : formatCompactWholeNumber(latestLikes),
      delta:
        latestLikes === null
          ? "No data"
          : formatSignedDelta(likesDelta, (value) => formatPercent(value, 0)),
    },
    {
      id: "engagement_rate",
      label: "Engagement",
      value:
        latestEngagementRate === null
          ? "--"
          : formatPercent(latestEngagementRate, 0),
      delta:
        latestEngagementRate === null
          ? "No data"
          : formatSignedDelta(engagementDelta, (value) => formatPercent(value, 0)),
    },
  ];
};
