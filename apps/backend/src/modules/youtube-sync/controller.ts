import { and, desc, eq, count, inArray, sql } from "drizzle-orm";

import { db } from "../../db";
import {
  insightArtifacts,
  comments,
  users,
  videos,
  youtubeAccounts,
} from "../../db/schema";
import {
  youtubeDataResponseSchema,
  youtubeSyncResponseSchema,
} from "../../routers/youtube/dto";
import { syncCommentsForVideo } from "../comments/controller";
import {
  buildVideoSummary,
  fetchVideoDetailsByIds,
} from "../videos/controller";
import { YoutubeRouteError } from "../youtube-errors/controller";
import {
  isYoutubeAuthorizationRevokedError,
  refreshYoutubeAccessToken,
  revokeYoutubeToken,
} from "../youtube-oauth/controller";
import { decryptSecret, encryptSecret } from "../../utils/secrets";

type YoutubeChannelResponse = {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
    };
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
};

type YoutubePlaylistItemsResponse = {
  items?: Array<{
    snippet?: {
      title?: string;
      publishedAt?: string;
      resourceId?: {
        videoId?: string;
      };
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
};

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

const fetchYoutubeJson = async (path: string, accessToken: string) => {
  const response = await fetch(`${YOUTUBE_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
};

const markVideoCommentsSynced = async (videoId: string, syncedAt: Date) => {
  await db
    .update(videos)
    .set({
      lastCommentsSyncedAt: syncedAt,
      updatedAt: syncedAt,
    })
    .where(eq(videos.id, videoId));
};

export const clearYoutubeDataForUser = async (userId: string) => {
  await db.transaction(async (tx) => {
    await tx
      .delete(insightArtifacts)
      .where(eq(insightArtifacts.userId, userId));

    await tx.delete(videos).where(eq(videos.userId, userId));

    await tx.delete(youtubeAccounts).where(eq(youtubeAccounts.userId, userId));
  });
};

export const disconnectYoutubeAccount = async (userId: string) => {
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, userId),
  });

  if (!account) {
    throw new YoutubeRouteError("YouTube account is not connected", 404);
  }

  const tokenToRevoke = account.refreshToken
    ? decryptSecret(account.refreshToken)
    : decryptSecret(account.accessToken);

  try {
    await revokeYoutubeToken(tokenToRevoke);
  } catch (error) {
    if (!isYoutubeAuthorizationRevokedError(error)) {
      throw new YoutubeRouteError(
        "Could not disconnect your YouTube account. Please try again.",
        500,
      );
    }
  }

  await clearYoutubeDataForUser(userId);
};

const fetchYoutubeJsonWithRefresh = async (
  path: string,
  account: { accessToken: string; refreshToken: string | null; userId: string },
): Promise<{ payload: unknown; accessToken: string }> => {
  const currentAccessToken = decryptSecret(account.accessToken);

  try {
    return {
      payload: await fetchYoutubeJson(path, currentAccessToken),
      accessToken: currentAccessToken,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const refreshToken = account.refreshToken
      ? decryptSecret(account.refreshToken)
      : null;
    const shouldRefresh =
      refreshToken &&
      (message.includes("401") ||
        message.toLowerCase().includes("invalid credentials"));

    if (!shouldRefresh) {
      if (
        message.includes("401") ||
        message.toLowerCase().includes("invalid credentials")
      ) {
        await clearYoutubeDataForUser(account.userId);
        throw new YoutubeRouteError("YouTube account is not connected", 404);
      }

      throw error;
    }

    let nextAccessToken = "";
    let nextExpiresAt: Date | null = null;

    try {
      const refreshed = await refreshYoutubeAccessToken(refreshToken);
      nextAccessToken = refreshed.access_token!;
      nextExpiresAt = refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000)
        : null;
    } catch (refreshError) {
      if (isYoutubeAuthorizationRevokedError(refreshError)) {
        await clearYoutubeDataForUser(account.userId);
        throw new YoutubeRouteError("YouTube account is not connected", 404);
      }

      throw refreshError;
    }

    await db
      .update(youtubeAccounts)
      .set({
        accessToken: encryptSecret(nextAccessToken),
        expiresAt: nextExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(youtubeAccounts.userId, account.userId));

    return {
      payload: await fetchYoutubeJson(path, nextAccessToken),
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

export const syncYoutubeAccount = async ({
  userId,
  maxVideoResults,
  commentSyncVideoLimit,
  commentsPerVideo,
}: {
  userId: string;
  maxVideoResults: number;
  commentSyncVideoLimit: number;
  commentsPerVideo: number;
}) => {
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, userId),
  });

  if (!account) {
    throw new YoutubeRouteError("YouTube account is not connected", 404);
  }

  const { payload: channelResponse, accessToken } =
    (await fetchYoutubeJsonWithRefresh(
      "/channels?part=snippet,contentDetails&mine=true",
      {
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        userId: account.userId,
      },
    )) as { payload: YoutubeChannelResponse; accessToken: string };

  const channel = channelResponse.items?.[0];
  if (!channel?.id) {
    throw new YoutubeRouteError("Could not load your YouTube channel");
  }
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new YoutubeRouteError("Could not load your uploaded videos");
  }

  const syncedAt = new Date();

  const videosResponse = (await fetchYoutubeJson(
    `/playlistItems?part=snippet&playlistId=${encodeURIComponent(uploadsPlaylistId)}&maxResults=${maxVideoResults}`,
    accessToken,
  )) as YoutubePlaylistItemsResponse;

  const recentVideos = (videosResponse.items || [])
    .map((item) => ({
      youtubeVideoId: item.snippet?.resourceId?.videoId || "",
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
  const enrichedRecentVideos = recentVideos.map((video) => {
    const details = videoDetailsById.get(video.youtubeVideoId);

    return {
      ...video,
      viewCount: details?.viewCount ?? null,
      likeCount: details?.likeCount ?? null,
      favoriteCount: details?.favoriteCount ?? null,
      commentCount: details?.commentCount ?? null,
      duration: details?.duration ?? null,
    };
  });
  const youtubeAccountUpdate = {
    channelId: channel.id,
    channelName: channel.snippet?.title || null,
    accessToken: encryptSecret(accessToken),
    lastSyncedAt: syncedAt,
    updatedAt: syncedAt,
  };

  if (enrichedRecentVideos.length === 0) {
    await db
      .update(youtubeAccounts)
      .set(youtubeAccountUpdate)
      .where(eq(youtubeAccounts.userId, userId));

    return youtubeSyncResponseSchema.parse({
      channel: {
        id: channel.id,
        title: channel.snippet?.title || null,
      },
      videos: [],
      commentsCount: 0,
      lastSyncedAt: syncedAt,
    });
  }

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
        updatedAt: syncedAt,
      },
    });

  const storedVideos = await db.query.videos.findMany({
    where: and(
      eq(videos.userId, userId),
      inArray(videos.youtubeVideoId, videoIds),
    ),
    orderBy: [desc(videos.publishedAt), desc(videos.id)],
  });

  const dashboardAnalysisVideoId = storedVideos[0]?.id ?? null;

  const videosForCommentSync = storedVideos.slice(0, commentSyncVideoLimit);

  for (const storedVideo of videosForCommentSync) {
    const didRefreshComments = await syncCommentsForVideo({
      videoId: storedVideo.id,
      youtubeVideoId: storedVideo.youtubeVideoId,
      commentsPerVideo,
    });

    if (didRefreshComments) {
      await markVideoCommentsSynced(storedVideo.id, syncedAt);
    }
  }

  const commentsCount = storedVideos.length
    ? ((
        await db
          .select({ count: count() })
          .from(comments)
          .where(
            inArray(
              comments.videoId,
              storedVideos.map((video) => video.id),
            ),
          )
      )[0]?.count ?? 0)
    : 0;

  await db
    .update(youtubeAccounts)
    .set(youtubeAccountUpdate)
    .where(eq(youtubeAccounts.userId, userId));

  return youtubeSyncResponseSchema.parse({
    channel: {
      id: channel.id,
      title: channel.snippet?.title || null,
    },
    videos: storedVideos.slice(0, maxVideoResults).map((video) =>
      buildVideoSummary({
        ...video,
        isUsedInDashboardAnalysis: dashboardAnalysisVideoId === video.id,
      }),
    ),
    commentsCount: commentsCount,
    lastSyncedAt: syncedAt,
  });
};

export const syncStoredVideoCommentsForAnalysis = async (input: {
  userId: string;
  videoId: string;
  commentsPerVideo: number;
  cooldownMs: number;
}) => {
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, input.userId),
  });

  if (!account) {
    throw new YoutubeRouteError("YouTube account is not connected", 404);
  }

  const selectedVideo = await db.query.videos.findFirst({
    where: and(eq(videos.userId, input.userId), eq(videos.id, input.videoId)),
  });

  if (!selectedVideo) {
    throw new YoutubeRouteError("Video not found", 404);
  }

  if (selectedVideo.lastManualCommentsSyncAt) {
    const elapsedMs =
      Date.now() - new Date(selectedVideo.lastManualCommentsSyncAt).getTime();
    if (elapsedMs < input.cooldownMs) {
      throw new YoutubeRouteError(
        "Regeneration for this video can be done once every 24hr.",
        429,
      );
    }
  }

  const syncedAt = new Date();
  const { accessToken } = await fetchYoutubeJsonWithRefresh(
    `/videos?part=id&id=${encodeURIComponent(selectedVideo.youtubeVideoId)}`,
    {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      userId: account.userId,
    },
  );

  const latestVideoDetails = await fetchVideoDetailsByIds(
    [selectedVideo.youtubeVideoId],
    accessToken,
    fetchYoutubeJson,
  );
  const nextVideoDetails = latestVideoDetails.get(selectedVideo.youtubeVideoId);

  await db
    .update(videos)
    .set({
      viewCount: nextVideoDetails?.viewCount ?? selectedVideo.viewCount,
      likeCount: nextVideoDetails?.likeCount ?? selectedVideo.likeCount,
      favoriteCount:
        nextVideoDetails?.favoriteCount ?? selectedVideo.favoriteCount,
      commentCount:
        nextVideoDetails?.commentCount ?? selectedVideo.commentCount,
      duration: nextVideoDetails?.duration ?? selectedVideo.duration,
      lastManualCommentsSyncAt: syncedAt,
      updatedAt: syncedAt,
    })
    .where(eq(videos.id, selectedVideo.id));

  const didRefreshComments = await syncCommentsForVideo({
    videoId: selectedVideo.id,
    youtubeVideoId: selectedVideo.youtubeVideoId,
    commentsPerVideo: input.commentsPerVideo,
  });

  if (didRefreshComments) {
    await markVideoCommentsSynced(selectedVideo.id, syncedAt);
  }
};

export const getStoredYoutubeData = async ({
  userId,
  cursor,
  limit,
}: {
  userId: string;
  cursor?: {
    publishedAt: string;
    id: string;
  } | null;
  limit?: number;
}) => {
  const pageSize = limit ?? 10;
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, userId),
  });

  if (!account) {
    throw new YoutubeRouteError("YouTube account is not connected", 404);
  }

  const cursorPublishedAt = cursor ? new Date(cursor.publishedAt) : null;

  const storedVideos = await db.query.videos.findMany({
    where: cursor
      ? and(
          eq(videos.userId, userId),
          sql`(
            ${videos.publishedAt} < ${cursorPublishedAt}
            or (
              ${videos.publishedAt} = ${cursorPublishedAt}
              and ${videos.id} < ${cursor.id}
            )
        )`,
        )
      : eq(videos.userId, userId),
    orderBy: [desc(videos.publishedAt), desc(videos.id)],
    limit: pageSize + 1,
  });

  const [{ count: totalVideosCount }] = await db
    .select({
      count: count(),
    })
    .from(videos)
    .where(eq(videos.userId, userId));

  const [{ count: commentsCount }] = await db
    .select({
      count: count(),
    })
    .from(comments)
    .innerJoin(videos, eq(comments.videoId, videos.id))
    .where(eq(videos.userId, userId));

  const hasNextPage = storedVideos.length > pageSize;
  const pageVideos = hasNextPage
    ? storedVideos.slice(0, pageSize)
    : storedVideos;

  const dashboardAnalysisVideoId = storedVideos[0]?.id ?? null;

  const lastVideo = pageVideos.at(-1);

  return youtubeDataResponseSchema.parse({
    channel: {
      id: account.channelId,
      title: account.channelName,
    },
    videos: pageVideos.map((video) =>
      buildVideoSummary({
        ...video,
        isUsedInDashboardAnalysis: dashboardAnalysisVideoId === video.id,
      }),
    ),
    nextCursor:
      hasNextPage && lastVideo
        ? {
            publishedAt: lastVideo.publishedAt?.toISOString(),
            id: lastVideo.id,
          }
        : null,
    totalVideosCount,
    commentsCount,
    lastSyncedAt: account.lastSyncedAt,
  });
};

export const ensureSyncCooldown = async ({
  userId,
  syncCooldownMs,
}: {
  userId: string;
  syncCooldownMs: number;
}) => {
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, userId),
  });

  if (!account) {
    throw new YoutubeRouteError("YouTube account is not connected", 404);
  }

  if (!account.lastSyncedAt) {
    return;
  }

  const elapsedMs = Date.now() - account.lastSyncedAt.getTime();
  if (elapsedMs < syncCooldownMs) {
    throw new YoutubeRouteError("Sync is available every 1 hour", 429);
  }
};
