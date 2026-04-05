import { asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "../../db";
import { comments } from "../../db/schema";
import type {
  SyncCommentsForVideoInput,
  YoutubeCommentThreadsResponse,
} from "./dto";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

const getYoutubeApiKey = () => {
  const value = process.env.YOUTUBE_API_KEY?.trim();
  if (!value) {
    throw new Error("YOUTUBE_API_KEY is not configured");
  }

  return value;
};

export const isCommentsDisabledError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("commentsDisabled") ||
    error.message.includes("has disabled comments")
  );
};

const isHandledCommentFetchError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message;

  return (
    isCommentsDisabledError(error) ||
    message.includes("videoNotFound") ||
    message.includes("forbidden") ||
    message.includes("processingFailure") ||
    message.includes("PERMISSION_DENIED")
  );
};

export const fetchPaginatedCommentsForVideo = async ({
  youtubeVideoId,
  commentsPerVideo,
}: Omit<SyncCommentsForVideoInput, "videoId">) => {
  const collectedItems: NonNullable<YoutubeCommentThreadsResponse["items"]> = [];
  let nextPageToken: string | undefined;

  while (collectedItems.length < commentsPerVideo) {
    const remaining = commentsPerVideo - collectedItems.length;
    const params = new URLSearchParams({
      part: "snippet",
      videoId: youtubeVideoId,
      order: "time",
      textFormat: "plainText",
      maxResults: String(Math.min(100, remaining)),
    });

    if (nextPageToken) {
      params.set("pageToken", nextPageToken);
    }

    params.set("key", getYoutubeApiKey());

    const response = await fetch(
      `${YOUTUBE_API_BASE_URL}/commentThreads?${params.toString()}`,
    );

    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        `YouTube API request failed (${response.status}): ${message || "Unknown error"}`,
      );
    }

    const payload = (await response.json()) as YoutubeCommentThreadsResponse;

    const items = payload.items || [];
    if (items.length === 0) {
      break;
    }

    collectedItems.push(...items);
    nextPageToken = payload.nextPageToken;

    if (!nextPageToken) {
      break;
    }
  }

  return collectedItems;
};

export const trimCommentsForVideo = async (
  videoId: string,
  commentsPerVideo: number,
) => {
  const storedComments = await db.query.comments.findMany({
    where: eq(comments.videoId, videoId),
    orderBy: [
      desc(comments.publishedAt),
      desc(comments.createdAt),
      asc(comments.youtubeCommentId),
    ],
  });

  const overflowComments = storedComments.slice(commentsPerVideo);
  if (overflowComments.length === 0) {
    return;
  }

  await db
    .delete(comments)
    .where(
      inArray(
        comments.id,
        overflowComments.map((comment) => comment.id),
      ),
    );
};

export const syncCommentsForVideo = async ({
  videoId,
  youtubeVideoId,
  commentsPerVideo,
}: SyncCommentsForVideoInput) => {
  let commentItems: NonNullable<YoutubeCommentThreadsResponse["items"]>;

  try {
    commentItems = await fetchPaginatedCommentsForVideo({
      youtubeVideoId,
      commentsPerVideo,
    });
  } catch (error) {
    if (isHandledCommentFetchError(error)) {
      return false;
    }

    throw error;
  }

  const commentValues = commentItems
    .map((item) => {
      const snippet = item.snippet?.topLevelComment?.snippet;
      const youtubeCommentId = item.snippet?.topLevelComment?.id || item.id || "";

      if (!snippet || !youtubeCommentId) return null;

      return {
        videoId,
        youtubeCommentId,
        text: snippet.textOriginal || snippet.textDisplay || "",
        publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
        likeCount: snippet.likeCount || 0,
      };
    })
    .filter(
      (
        value,
      ): value is {
        videoId: string;
        youtubeCommentId: string;
        text: string;
        publishedAt: Date | null;
        likeCount: number;
      } => Boolean(value?.text),
    );

  if (commentValues.length === 0) {
    return false;
  }

  await db.insert(comments).values(commentValues).onConflictDoNothing({
    target: comments.youtubeCommentId,
  });

  await trimCommentsForVideo(videoId, commentsPerVideo);
  return true;
};
