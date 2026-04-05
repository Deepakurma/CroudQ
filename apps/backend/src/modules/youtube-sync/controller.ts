import { and, desc, eq, inArray, sql } from "drizzle-orm";

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

type FetchYoutubeJson = <T>(path: string, accessToken: string) => Promise<T>;

type SyncYoutubeAccountOptions = {
  userId: string;
  maxVideoResults: number;
  commentSyncVideoLimit: number;
  commentsPerVideo: number;
  fetchYoutubeJson: FetchYoutubeJson;
};

type GetStoredYoutubeDataOptions = {
  userId: string;
  cursor?: string;
  limit?: number;
};

type EnsureSyncCooldownOptions = {
  userId: string;
  syncCooldownMs: number;
};

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_INSIGHT_PLATFORM = "youtube" as const;
const DEFAULT_STORED_VIDEOS_PAGE_SIZE = 10;
const STORED_VIDEOS_PAGE_SIZE_CAP = 25;
const VIDEO_CURSOR_FALLBACK_ISO = "1970-01-01T00:00:00.000Z";

type StoredVideosCursor = {
  publishedAt: string;
  id: string;
};

const decodeStoredVideosCursor = (value: string): StoredVideosCursor => {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      publishedAt?: unknown;
      id?: unknown;
    };

    if (
      typeof parsed.publishedAt !== "string" ||
      Number.isNaN(new Date(parsed.publishedAt).getTime()) ||
      typeof parsed.id !== "string" ||
      parsed.id.length === 0
    ) {
      throw new Error("Invalid cursor");
    }

    return {
      publishedAt: parsed.publishedAt,
      id: parsed.id,
    };
  } catch {
    throw new YoutubeRouteError("Invalid videos cursor", 400);
  }
};

const encodeStoredVideosCursor = (video: {
  publishedAt: Date | null;
  id: string;
}) =>
  Buffer.from(
    JSON.stringify({
      publishedAt: video.publishedAt?.toISOString() ?? VIDEO_CURSOR_FALLBACK_ISO,
      id: video.id,
    } satisfies StoredVideosCursor),
    "utf8",
  ).toString("base64url");

const fetchAuthorizedJson = async <T>(
  path: string,
  accessToken: string,
): Promise<T> => {
  const response = await fetch(`${YOUTUBE_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `YouTube API request failed (${response.status}): ${message || "Unknown error"}`,
    );
  }

  return (await response.json()) as T;
};

const fetchYoutubeJson = async <T>(
  path: string,
  accessToken: string,
): Promise<T> =>
  fetchAuthorizedJson<T>(path, accessToken);

const getDashboardAnalysisVideoIds = async (userId: string) =>
  (
    await db.query.videos.findMany({
      where: eq(videos.userId, userId),
      orderBy: desc(videos.publishedAt),
      limit: 1,
    })
  ).map((video) => video.id);

export const clearYoutubeDataForUser = async (userId: string) => {
  await db.transaction(async (tx) => {
    await tx
      .delete(insightArtifacts)
      .where(
        and(
          eq(insightArtifacts.userId, userId),
          eq(insightArtifacts.platform, YOUTUBE_INSIGHT_PLATFORM),
        ),
      );

    await tx
      .delete(videos)
      .where(eq(videos.userId, userId));

    await tx
      .delete(youtubeAccounts)
      .where(eq(youtubeAccounts.userId, userId));
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
    ? decryptSecret(account.refreshToken, "YOUTUBE_TOKEN_ENCRYPTION_KEY")
    : decryptSecret(account.accessToken, "YOUTUBE_TOKEN_ENCRYPTION_KEY");

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
      if (
        message.includes("401") ||
        message.toLowerCase().includes("invalid credentials")
      ) {
        await clearYoutubeDataForUser(account.userId);
        throw new YoutubeRouteError("YouTube account is not connected", 404);
      }

      throw error;
    }

    let refreshed: Awaited<ReturnType<typeof refreshYoutubeAccessToken>>;

    try {
      refreshed = await refreshYoutubeAccessToken(refreshToken);
    } catch (refreshError) {
      if (isYoutubeAuthorizationRevokedError(refreshError)) {
        await clearYoutubeDataForUser(account.userId);
        throw new YoutubeRouteError("YouTube account is not connected", 404);
      }

      throw refreshError;
    }

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
  commentSyncVideoLimit,
  commentsPerVideo,
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
      "/channels?part=snippet,contentDetails&mine=true",
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
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new YoutubeRouteError("Could not load your uploaded videos");
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

  const videosResponse = await fetchYoutubeJson<YoutubePlaylistItemsResponse>(
    `/playlistItems?part=snippet&playlistId=${encodeURIComponent(uploadsPlaylistId)}&maxResults=${maxVideoResults}`,
    accessToken,
  );

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
  const dashboardAnalysisVideoIds = new Set(
    await getDashboardAnalysisVideoIds(userId),
  );

  const videosForCommentSync =
    commentSyncVideoLimit > 0
      ? sortedStoredVideos.slice(0, commentSyncVideoLimit)
      : [];

  for (const storedVideo of videosForCommentSync) {
    const didRefreshComments = await syncCommentsForVideo({
      videoId: storedVideo.id,
      youtubeVideoId: storedVideo.youtubeVideoId,
      commentsPerVideo,
    });

    if (didRefreshComments) {
      await db
        .update(videos)
        .set({
          lastCommentsSyncedAt: syncedAt,
          updatedAt: syncedAt,
        })
        .where(eq(videos.id, storedVideo.id));
    }
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

  return youtubeSyncResponseSchema.parse({
    channel: {
      id: channel.id,
      title: channel.snippet?.title || null,
    },
    videos: sortedStoredVideos.slice(0, maxVideoResults).map((video) =>
      buildVideoSummary({
        ...video,
        isUsedInDashboardAnalysis: dashboardAnalysisVideoIds.has(video.id),
      }),
    ),
    commentsCount: storedComments.length,
    lastSyncedAt: syncedAt,
  });
};

export const syncYoutubeAccount = async (options: SyncYoutubeAccountOptions) =>
  fetchAndStoreYoutubeData(options);

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
    fetchYoutubeJson,
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
      commentCount: nextVideoDetails?.commentCount ?? selectedVideo.commentCount,
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
    await db
      .update(videos)
      .set({
        lastCommentsSyncedAt: syncedAt,
        updatedAt: syncedAt,
      })
      .where(eq(videos.id, selectedVideo.id));
  }
};

export const getStoredYoutubeData = async ({
  userId,
  cursor,
  limit,
}: GetStoredYoutubeDataOptions) => {
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, userId),
  });

  if (!account) {
    throw new YoutubeRouteError("YouTube account is not connected", 404);
  }

  const resolvedLimit = Math.min(
    Math.max(limit ?? DEFAULT_STORED_VIDEOS_PAGE_SIZE, 1),
    STORED_VIDEOS_PAGE_SIZE_CAP,
  );
  const decodedCursor = cursor ? decodeStoredVideosCursor(cursor) : null;
  const cursorPublishedAt = decodedCursor
    ? new Date(decodedCursor.publishedAt)
    : null;
  const videoOrderPublishedAt = sql<Date>`coalesce(${videos.publishedAt}, to_timestamp(0))`;

  const storedVideos = await db.query.videos.findMany({
    where: decodedCursor
      ? and(
          eq(videos.userId, userId),
          sql`(
            ${videoOrderPublishedAt} < ${cursorPublishedAt}
            or (
              ${videoOrderPublishedAt} = ${cursorPublishedAt}
              and ${videos.id} < ${decodedCursor.id}
            )
          )`,
        )
      : eq(videos.userId, userId),
    orderBy: [sql`${videoOrderPublishedAt} desc`, desc(videos.id)],
    limit: resolvedLimit + 1,
  });

  const [{ count: totalVideosCount }] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(videos)
    .where(eq(videos.userId, userId));

  const [{ count: commentsCount }] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(comments)
    .innerJoin(videos, eq(comments.videoId, videos.id))
    .where(eq(videos.userId, userId));

  const hasNextPage = storedVideos.length > resolvedLimit;
  const pageVideos = hasNextPage
    ? storedVideos.slice(0, resolvedLimit)
    : storedVideos;
  const dashboardAnalysisVideoIds = new Set(
    await getDashboardAnalysisVideoIds(userId),
  );

  return youtubeDataResponseSchema.parse({
    channel: {
      id: account.channelId,
      title: account.channelName,
    },
    videos: pageVideos.map((video) =>
      buildVideoSummary({
        ...video,
        isUsedInDashboardAnalysis: dashboardAnalysisVideoIds.has(video.id),
      }),
    ),
    nextCursor:
      hasNextPage && pageVideos.length > 0
        ? encodeStoredVideosCursor(pageVideos[pageVideos.length - 1]!)
        : null,
    totalVideosCount,
    commentsCount,
    lastSyncedAt: account.lastSyncedAt,
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
    throw new YoutubeRouteError("Sync is available every 1 hour", 429);
  }
};
