import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "../../db";
import {
  comments,
  users,
  videos,
  youtubeAccounts,
} from "../../db/schema";
import { youtubeDataResponseSchema } from "../../routers/youtube/dto";
import { buildPerformanceComparison } from "../overviewstats/controller";
import { syncCommentsForVideo } from "../comments/controller";
import {
  buildVideoSummary,
  fetchVideoAnalyticsByIds,
  fetchVideoDetailsByIds,
} from "../videos/controller";
import { YoutubeRouteError } from "../youtube-errors/controller";
import { refreshYoutubeAccessToken } from "../youtube-oauth/controller";
import { decryptSecret, encryptSecret } from "../../utils/secrets";

type YoutubeChannelResponse = {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
    };
  }>;
};

type YoutubeSearchResponse = {
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
};

type FetchAuthorizedJson = <T>(url: string, accessToken: string) => Promise<T>;
type FetchYoutubeJson = <T>(path: string, accessToken: string) => Promise<T>;

type SyncYoutubeAccountOptions = {
  userId: string;
  maxVideoResults: number;
  commentsPerVideo: number;
  fetchAuthorizedJson: FetchAuthorizedJson;
  fetchYoutubeJson: FetchYoutubeJson;
};

type GetStoredYoutubeDataOptions = {
  userId: string;
};

type EnsureSyncCooldownOptions = {
  userId: string;
  syncCooldownMs: number;
};

const fetchYoutubeJsonWithRefresh = async <T>(
  path: string,
  account: { accessToken: string; refreshToken: string | null; userId: string },
  fetchYoutubeJson: FetchYoutubeJson,
) => {
  const currentAccessToken = decryptSecret(
    account.accessToken,
    "YOUTUBE_TOKEN_ENCRYPTION_KEY",
  );

  try {
    return {
      payload: await fetchYoutubeJson<T>(path, currentAccessToken),
      accessToken: currentAccessToken,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const refreshToken = account.refreshToken
      ? decryptSecret(account.refreshToken, "YOUTUBE_TOKEN_ENCRYPTION_KEY")
      : null;
    const shouldRefresh =
      refreshToken &&
      (message.includes("401") ||
        message.toLowerCase().includes("invalid credentials"));

    if (!shouldRefresh) {
      throw error;
    }

    const refreshed = await refreshYoutubeAccessToken(refreshToken);
    const nextAccessToken = refreshed.access_token!;
    const nextExpiresAt = refreshed.expires_in
      ? new Date(Date.now() + refreshed.expires_in * 1000)
      : null;

    await db
      .update(youtubeAccounts)
      .set({
        accessToken: encryptSecret(
          nextAccessToken,
          "YOUTUBE_TOKEN_ENCRYPTION_KEY",
        ),
        expiresAt: nextExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(youtubeAccounts.userId, account.userId));

    return {
      payload: await fetchYoutubeJson<T>(path, nextAccessToken),
      accessToken: nextAccessToken,
    };
  }
};

export const ensureUserExists = async (userId: string) => {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (existingUser) {
    return existingUser;
  }

  throw new YoutubeRouteError("Could not connect your YouTube account", 404);
};

const fetchAndStoreYoutubeData = async ({
  userId,
  maxVideoResults,
  commentsPerVideo,
  fetchAuthorizedJson,
  fetchYoutubeJson,
}: SyncYoutubeAccountOptions) => {
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, userId),
  });

  if (!account) {
    throw new YoutubeRouteError("YouTube account is not connected", 404);
  }

  const { payload: channelResponse, accessToken } =
    await fetchYoutubeJsonWithRefresh<YoutubeChannelResponse>(
      "/channels?part=snippet&mine=true",
      {
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        userId: account.userId,
      },
      fetchYoutubeJson,
    );

  const channel = channelResponse.items?.[0];
  if (!channel?.id) {
    throw new YoutubeRouteError("Could not load your YouTube channel");
  }

  const syncedAt = new Date();

  await db
    .update(youtubeAccounts)
    .set({
      channelId: channel.id,
      channelName: channel.snippet?.title || null,
      accessToken: encryptSecret(accessToken, "YOUTUBE_TOKEN_ENCRYPTION_KEY"),
      updatedAt: syncedAt,
    })
    .where(eq(youtubeAccounts.userId, userId));

  const videosResponse = await fetchYoutubeJson<YoutubeSearchResponse>(
    `/search?part=snippet&forMine=true&type=video&maxResults=${maxVideoResults}`,
    accessToken,
  );

  const recentVideos = (videosResponse.items || [])
    .map((item) => ({
      youtubeVideoId: item.id?.videoId || "",
      title: item.snippet?.title || "Untitled video",
      publishedAt: item.snippet?.publishedAt
        ? new Date(item.snippet.publishedAt)
        : null,
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        null,
    }))
    .filter((video) => video.youtubeVideoId);

  const videoIds = recentVideos.map((video) => video.youtubeVideoId);
  const videoDetailsById = await fetchVideoDetailsByIds(
    videoIds,
    accessToken,
    fetchYoutubeJson,
  );
  const videoAnalyticsById = await fetchVideoAnalyticsByIds(
    videoIds,
    accessToken,
    fetchAuthorizedJson,
  );
  const enrichedRecentVideos = recentVideos.map((video) => {
    const details = videoDetailsById.get(video.youtubeVideoId);
    const analytics = videoAnalyticsById.get(video.youtubeVideoId);

    return {
      ...video,
      viewCount: details?.viewCount ?? null,
      likeCount: details?.likeCount ?? null,
      favoriteCount: details?.favoriteCount ?? null,
      commentCount: details?.commentCount ?? null,
      duration: details?.duration ?? null,
      analyticsViews: analytics?.analyticsViews ?? null,
      analyticsLikes: analytics?.analyticsLikes ?? null,
      analyticsComments: analytics?.analyticsComments ?? null,
      analyticsShares: analytics?.analyticsShares ?? null,
      estimatedMinutesWatched: analytics?.estimatedMinutesWatched ?? null,
      averageViewDuration: analytics?.averageViewDuration ?? null,
      subscribersGained: analytics?.subscribersGained ?? null,
      subscribersLost: analytics?.subscribersLost ?? null,
    };
  });

  if (enrichedRecentVideos.length === 0) {
    await db
      .update(youtubeAccounts)
      .set({
        channelId: channel.id,
        channelName: channel.snippet?.title || null,
        accessToken: encryptSecret(
          accessToken,
          "YOUTUBE_TOKEN_ENCRYPTION_KEY",
        ),
        lastSyncedAt: syncedAt,
        updatedAt: syncedAt,
      })
      .where(eq(youtubeAccounts.userId, userId));

    return youtubeDataResponseSchema.parse({
      channel: {
        id: channel.id,
        title: channel.snippet?.title || null,
      },
      videos: [],
      commentsCount: 0,
      lastSyncedAt: syncedAt,
      performanceComparison: null,
    });
  }

  const existingStoredVideos = await db.query.videos.findMany({
    where: and(
      eq(videos.userId, userId),
      inArray(videos.youtubeVideoId, videoIds),
    ),
  });

  const existingVideoIds = new Set(
    existingStoredVideos.map((video) => video.youtubeVideoId),
  );
  const newVideos = enrichedRecentVideos.filter(
    (video) => !existingVideoIds.has(video.youtubeVideoId),
  );

  if (enrichedRecentVideos.length > 0) {
    await db
      .insert(videos)
      .values(
        enrichedRecentVideos.map((video) => ({
          youtubeVideoId: video.youtubeVideoId,
          title: video.title,
          userId,
          publishedAt: video.publishedAt,
          thumbnailUrl: video.thumbnailUrl,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          favoriteCount: video.favoriteCount,
          commentCount: video.commentCount,
          duration: video.duration,
          analyticsViews: video.analyticsViews,
          analyticsLikes: video.analyticsLikes,
          analyticsComments: video.analyticsComments,
          analyticsShares: video.analyticsShares,
          estimatedMinutesWatched: video.estimatedMinutesWatched,
          averageViewDuration: video.averageViewDuration,
          subscribersGained: video.subscribersGained,
          subscribersLost: video.subscribersLost,
          updatedAt: syncedAt,
        })),
      )
      .onConflictDoUpdate({
        target: videos.youtubeVideoId,
        set: {
          title: sql`excluded.title`,
          publishedAt: sql`excluded.published_at`,
          thumbnailUrl: sql`excluded.thumbnail_url`,
          viewCount: sql`excluded.view_count`,
          likeCount: sql`excluded.like_count`,
          favoriteCount: sql`excluded.favorite_count`,
          commentCount: sql`excluded.comment_count`,
          duration: sql`excluded.duration`,
          analyticsViews: sql`excluded.analytics_views`,
          analyticsLikes: sql`excluded.analytics_likes`,
          analyticsComments: sql`excluded.analytics_comments`,
          analyticsShares: sql`excluded.analytics_shares`,
          estimatedMinutesWatched: sql`excluded.estimated_minutes_watched`,
          averageViewDuration: sql`excluded.average_view_duration`,
          subscribersGained: sql`excluded.subscribers_gained`,
          subscribersLost: sql`excluded.subscribers_lost`,
          updatedAt: syncedAt,
        },
      });
  }

  const storedVideos = await db.query.videos.findMany({
    where: and(
      eq(videos.userId, userId),
      inArray(videos.youtubeVideoId, videoIds),
    ),
  });

  const sortedStoredVideos = [...storedVideos].sort((a, b) => {
    const first = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const second = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return second - first;
  });

  const videosForCommentSync =
    newVideos.length > 0
      ? sortedStoredVideos.slice(0, maxVideoResults)
      : sortedStoredVideos.slice(0, Math.min(2, maxVideoResults));

  for (const storedVideo of videosForCommentSync) {
    await syncCommentsForVideo({
      videoId: storedVideo.id,
      youtubeVideoId: storedVideo.youtubeVideoId,
      accessToken,
      commentsPerVideo,
      fetchYoutubeJson,
    });
  }

  const storedComments = storedVideos.length
    ? await db.query.comments.findMany({
        where: inArray(
          comments.videoId,
          storedVideos.map((video) => video.id),
        ),
      })
    : [];

  await db
    .update(youtubeAccounts)
    .set({
      channelId: channel.id,
      channelName: channel.snippet?.title || null,
      accessToken: encryptSecret(
        accessToken,
        "YOUTUBE_TOKEN_ENCRYPTION_KEY",
      ),
      lastSyncedAt: syncedAt,
      updatedAt: syncedAt,
    })
    .where(eq(youtubeAccounts.userId, userId));

  return youtubeDataResponseSchema.parse({
    channel: {
      id: channel.id,
      title: channel.snippet?.title || null,
    },
    videos: sortedStoredVideos.slice(0, maxVideoResults).map(buildVideoSummary),
    commentsCount: storedComments.length,
    lastSyncedAt: syncedAt,
    performanceComparison: buildPerformanceComparison(sortedStoredVideos),
  });
};

export const syncYoutubeAccount = async (options: SyncYoutubeAccountOptions) =>
  fetchAndStoreYoutubeData(options);

export const getStoredYoutubeData = async ({
  userId,
}: GetStoredYoutubeDataOptions) => {
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, userId),
  });

  if (!account) {
    throw new YoutubeRouteError("YouTube account is not connected", 404);
  }

  const storedVideos = await db.query.videos.findMany({
    where: eq(videos.userId, userId),
    orderBy: desc(videos.publishedAt),
  });

  const storedComments = storedVideos.length
    ? await db.query.comments.findMany({
        where: inArray(
          comments.videoId,
          storedVideos.map((video) => video.id),
        ),
      })
    : [];

  const sortedStoredVideos = [...storedVideos].sort((a, b) => {
    const first = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const second = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return second - first;
  });

  return youtubeDataResponseSchema.parse({
    channel: {
      id: account.channelId,
      title: account.channelName,
    },
    videos: sortedStoredVideos.map(buildVideoSummary),
    commentsCount: storedComments.length,
    lastSyncedAt: account.lastSyncedAt,
    performanceComparison: buildPerformanceComparison(sortedStoredVideos),
  });
};

export const ensureSyncCooldown = async ({
  userId,
  syncCooldownMs,
}: EnsureSyncCooldownOptions) => {
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, userId),
  });

  if (!account) {
    throw new YoutubeRouteError("YouTube account is not connected", 404);
  }

  if (!account.lastSyncedAt) {
    return;
  }

  const elapsedMs = Date.now() - new Date(account.lastSyncedAt).getTime();
  if (elapsedMs < syncCooldownMs) {
    throw new YoutubeRouteError("Sync is available every 10 minutes", 429);
  }
};
