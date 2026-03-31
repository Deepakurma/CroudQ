import type {
  DashboardOverviewStat,
  StoredVideoMetrics,
  YoutubePerformanceComparison,
  YoutubeVideoPerformanceSnapshot,
} from "./dto";

const parseYoutubeDurationToSeconds = (duration: string | null | undefined) => {
  if (!duration) {
    return 0;
  }

  const match = duration.match(
    /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/,
  );

  if (!match) {
    return 0;
  }

  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
};

const percentDelta = (latest: number, previous: number) => {
  const baseline = Math.max(Math.abs(previous), 0.0001);
  return ((latest - previous) / baseline) * 100;
};

const formatCompactNumber = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  }

  return value >= 100 ? value.toFixed(0) : value.toFixed(1);
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

const formatDurationCompact = (seconds: number) => {
  const roundedSeconds = Math.max(Math.round(seconds), 0);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
};

const formatPercent = (value: number, fractionDigits = 1) =>
  `${value.toFixed(fractionDigits)}%`;

const formatSignedDelta = (
  value: number | null,
  formatter: (next: number) => string,
) => {
  if (value === null || !Number.isFinite(value)) {
    return "New";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatter(value)}`;
};

const getVideoViews = (video: StoredVideoMetrics) =>
  Math.max(video.analyticsViews ?? video.viewCount ?? 0, 0);

const getVideoLikes = (video: StoredVideoMetrics) =>
  Math.max(video.analyticsLikes ?? video.likeCount ?? 0, 0);

const getVideoComments = (video: StoredVideoMetrics) =>
  Math.max(video.analyticsComments ?? video.commentCount ?? 0, 0);

const getVideoAverageWatchTimeSeconds = (video: StoredVideoMetrics) => {
  const averageViewDuration = Math.max(video.averageViewDuration ?? 0, 0);

  if (averageViewDuration > 0) {
    return averageViewDuration;
  }

  const views = getVideoViews(video);
  return ((video.estimatedMinutesWatched ?? 0) * 60) / Math.max(views, 1);
};

const getAnalyticsViews = (video: StoredVideoMetrics) =>
  video.analyticsViews === null ? null : Math.max(video.analyticsViews, 0);

const getAnalyticsLikes = (video: StoredVideoMetrics) =>
  video.analyticsLikes === null ? null : Math.max(video.analyticsLikes, 0);

const getAnalyticsComments = (video: StoredVideoMetrics) =>
  video.analyticsComments === null ? null : Math.max(video.analyticsComments, 0);

const getAnalyticsAverageViewDuration = (video: StoredVideoMetrics) =>
  video.averageViewDuration === null
    ? null
    : Math.max(video.averageViewDuration, 0);

const getPublicViews = (video: StoredVideoMetrics) =>
  video.viewCount === null ? null : Math.max(video.viewCount, 0);

const getPublicLikes = (video: StoredVideoMetrics) =>
  video.likeCount === null ? null : Math.max(video.likeCount, 0);

const getPublicComments = (video: StoredVideoMetrics) =>
  video.commentCount === null ? null : Math.max(video.commentCount, 0);

const buildVideoPerformanceSnapshot = (
  video: StoredVideoMetrics,
): YoutubeVideoPerformanceSnapshot => {
  const ageHours = Math.max(
    video.publishedAt
      ? (Date.now() - new Date(video.publishedAt).getTime()) / 3_600_000
      : 1,
    1,
  );
  const views = getVideoViews(video);
  const likes = getVideoLikes(video);
  const comments = getVideoComments(video);
  const shares = Math.max(video.analyticsShares ?? 0, 0);
  const subscribersNet =
    (video.subscribersGained ?? 0) - (video.subscribersLost ?? 0);
  const viewsPerHour = views / ageHours;
  const likesPerThousandViews = (likes / Math.max(views, 1)) * 1000;
  const commentsPerThousandViews = (comments / Math.max(views, 1)) * 1000;
  const sharesPerThousandViews = (shares / Math.max(views, 1)) * 1000;
  const engagementScore =
    likesPerThousandViews * 0.45 +
    commentsPerThousandViews * 0.35 +
    sharesPerThousandViews * 0.2;
  const durationSeconds = parseYoutubeDurationToSeconds(video.duration);
  const averageViewDuration = getVideoAverageWatchTimeSeconds(video);
  const retentionRatio =
    durationSeconds > 0
      ? Math.min(averageViewDuration / durationSeconds, 1)
      : 0;
  const watchTimePerView = averageViewDuration;
  const audienceResponseScore =
    (subscribersNet / Math.max(views, 1)) * 1000 * 0.7 +
    commentsPerThousandViews * 0.3;

  return {
    videoId: video.id,
    youtubeVideoId: video.youtubeVideoId,
    title: video.title,
    publishedAt: video.publishedAt,
    ageHours,
    views,
    likes,
    comments,
    shares,
    subscribersNet,
    viewsPerHour,
    likesPerThousandViews,
    commentsPerThousandViews,
    sharesPerThousandViews,
    engagementScore,
    retentionRatio,
    watchTimePerView,
    audienceResponseScore,
  };
};

const buildOverviewAggregate = (videos: StoredVideoMetrics[]) => {
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let watchTimeViews = 0;
  let weightedWatchTimeSeconds = 0;
  let hasMissingViews = false;
  let hasMissingLikes = false;
  let hasMissingComments = false;
  let hasMissingWatchTime = false;

  for (const video of videos) {
    const publicViews = getPublicViews(video);
    const publicLikes = getPublicLikes(video);
    const publicComments = getPublicComments(video);
    const averageViewDuration = getAnalyticsAverageViewDuration(video);

    if (publicViews === null) {
      hasMissingViews = true;
    } else {
      totalViews += publicViews;
    }

    if (publicLikes === null) {
      hasMissingLikes = true;
    } else {
      totalLikes += publicLikes;
    }

    if (publicComments === null) {
      hasMissingComments = true;
    } else {
      totalComments += publicComments;
    }

    if (publicViews === null || averageViewDuration === null) {
      hasMissingWatchTime = true;
    } else {
      watchTimeViews += publicViews;
      weightedWatchTimeSeconds += averageViewDuration * publicViews;
    }
  }

  return {
    totalViews: hasMissingViews ? null : totalViews,
    totalLikes: hasMissingLikes ? null : totalLikes,
    totalComments: hasMissingComments ? null : totalComments,
    averageWatchTimeSeconds:
      hasMissingWatchTime
        ? null
        : weightedWatchTimeSeconds / Math.max(watchTimeViews, 1),
  };
};

export const buildPerformanceComparison = (
  sortedVideos: StoredVideoMetrics[],
): YoutubePerformanceComparison | null => {
  if (sortedVideos.length < 2) {
    return null;
  }

  const [latestVideo, previousVideo] = sortedVideos;
  const latest = buildVideoPerformanceSnapshot(latestVideo);
  const previous = buildVideoPerformanceSnapshot(previousVideo);

  return {
    latest,
    previous,
    deltas: {
      viewsPerHourPct: percentDelta(latest.viewsPerHour, previous.viewsPerHour),
      engagementScorePct: percentDelta(
        latest.engagementScore,
        previous.engagementScore,
      ),
      retentionRatioPct: percentDelta(
        latest.retentionRatio,
        previous.retentionRatio,
      ),
      audienceResponsePct: percentDelta(
        latest.audienceResponseScore,
        previous.audienceResponseScore,
      ),
      watchTimePerViewPct: percentDelta(
        latest.watchTimePerView,
        previous.watchTimePerView,
      ),
    },
  };
};

export const buildDashboardOverviewStats = (
  sortedVideos: StoredVideoMetrics[],
  analysisWindowSize = sortedVideos.length,
): DashboardOverviewStat[] => {
  if (sortedVideos.length === 0 || analysisWindowSize <= 0) {
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
        id: "avg_watch_time",
        label: "Avg watch time",
        value: "--",
        delta: "No data",
      },
      {
        id: "total_likes",
        label: "Total likes",
        value: "--",
        delta: "No data",
      },
    ];
  }

  const selectedWindow = sortedVideos.slice(0, analysisWindowSize);
  const previousWindow = sortedVideos.slice(
    analysisWindowSize,
    analysisWindowSize * 2,
  );
  const currentOverview = buildOverviewAggregate(selectedWindow);
  const previousOverview =
    previousWindow.length === selectedWindow.length
      ? buildOverviewAggregate(previousWindow)
      : null;

  const viewsDelta =
    previousOverview !== null &&
    currentOverview.totalViews !== null &&
    previousOverview.totalViews !== null
      ? percentDelta(
          currentOverview.totalViews,
          previousOverview.totalViews,
        )
      : null;
  const likesDelta =
    previousOverview !== null &&
    currentOverview.totalLikes !== null &&
    previousOverview.totalLikes !== null
      ? percentDelta(
          currentOverview.totalLikes,
          previousOverview.totalLikes,
        )
      : null;
  const commentsDelta =
    previousOverview !== null &&
    currentOverview.totalComments !== null &&
    previousOverview.totalComments !== null
      ? percentDelta(
          currentOverview.totalComments,
          previousOverview.totalComments,
        )
      : null;
  const averageWatchTimeDelta =
    previousOverview !== null &&
    currentOverview.averageWatchTimeSeconds !== null &&
    previousOverview.averageWatchTimeSeconds !== null
      ? percentDelta(
          currentOverview.averageWatchTimeSeconds,
          previousOverview.averageWatchTimeSeconds,
        )
      : null;

  return [
    {
      id: "total_views",
      label: "Total views",
      value:
        currentOverview.totalViews === null
          ? "--"
          : formatCompactWholeNumber(currentOverview.totalViews),
      delta:
        currentOverview.totalViews === null
          ? "No data"
          : formatSignedDelta(viewsDelta, (value) => formatPercent(value, 0)),
    },
    {
      id: "total_comments",
      label: "Comments",
      value:
        currentOverview.totalComments === null
          ? "--"
          : formatCompactWholeNumber(currentOverview.totalComments),
      delta:
        currentOverview.totalComments === null
          ? "No data"
          : formatSignedDelta(commentsDelta, (value) => formatPercent(value, 0)),
    },
    {
      id: "avg_watch_time",
      label: "Avg watch time",
      value:
        currentOverview.averageWatchTimeSeconds !== null
          ? formatDurationCompact(currentOverview.averageWatchTimeSeconds)
          : "--",
      delta:
        currentOverview.averageWatchTimeSeconds === null
          ? "No data"
          : formatSignedDelta(averageWatchTimeDelta, (value) =>
              formatPercent(value, 0),
            ),
    },
    {
      id: "total_likes",
      label: "Total likes",
      value:
        currentOverview.totalLikes === null
          ? "--"
          : formatCompactWholeNumber(currentOverview.totalLikes),
      delta:
        currentOverview.totalLikes === null
          ? "No data"
          : formatSignedDelta(likesDelta, (value) => formatPercent(value, 0)),
    },
  ];
};
