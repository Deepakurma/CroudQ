import { createHash } from "crypto";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../db";
import {
  comments,
  insightArtifacts,
  videos,
  youtubeAccounts,
} from "../../db/schema";
import { generateStructuredJson } from "../ai/controller";

const MODEL = "gpt-5-mini";
const PROMPT_VERSION = "2026-04-04.v01";
const REGEN_THRESHOLD = 5;

export const VideoPayloadSchema = z.object({
  sentimentCard: z.object({
    positivePercent: z.number().int().min(0).max(100),
    dominantTone: z.enum(["positive", "neutral", "negative"]),
    subtext: z.string(),
    split: z
      .array(
        z.object({
          tone: z.enum(["positive", "neutral", "negative"]),
          value: z.number().int().min(0).max(100),
        }),
      )
      .length(3),
  }),
  topThemes: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        count: z.number().int().nonnegative(),
        quotes: z.array(z.string()).max(3),
      }),
    )
    .max(10),
  needsAttention: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        implication: z.string(),
      }),
    )
    .max(5),
  nextContentMove: z.object({
    title: z.string(),
    steps: z.array(z.string()).max(3),
    reasons: z.array(z.string()).max(3),
    tag: z.enum(["High impact", "Quick win", "Needs fixing"]),
    evidenceLine: z.string(),
  }),
});

const insightJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sentimentCard", "topThemes", "needsAttention", "nextContentMove"],
  properties: {
    sentimentCard: {
      type: "object",
      additionalProperties: false,
      required: ["positivePercent", "dominantTone", "subtext", "split"],
      properties: {
        positivePercent: { type: "integer" },
        dominantTone: {
          type: "string",
          enum: ["positive", "neutral", "negative"],
        },
        subtext: { type: "string" },
        split: {
          type: "array",
          minItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["tone", "value"],
            properties: {
              tone: {
                type: "string",
                enum: ["positive", "neutral", "negative"],
              },
              value: { type: "integer" },
            },
          },
        },
      },
    },
    topThemes: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "count", "quotes"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          count: { type: "integer" },
          quotes: {
            type: "array",
            maxItems: 3,
            items: { type: "string" },
          },
        },
      },
    },
    needsAttention: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "implication"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          implication: { type: "string" },
        },
      },
    },
    nextContentMove: {
      type: "object",
      additionalProperties: false,
      required: ["title", "steps", "reasons", "tag", "evidenceLine"],
      properties: {
        title: { type: "string" },
        steps: {
          type: "array",
          maxItems: 3,
          items: { type: "string" },
        },
        reasons: {
          type: "array",
          maxItems: 3,
          items: { type: "string" },
        },
        tag: {
          type: "string",
          enum: ["High impact", "Quick win", "Needs fixing"],
        },
        evidenceLine: { type: "string" },
      },
    },
  },
};

const SYSTEM_PROMPT = `
You are CroudQ's insight engine.

Use only the provided data. Do not invent facts, metrics, or timelines.
Keep output short, clear, and useful for a creator.
If evidence is weak, say that plainly instead of forcing a strong take.
If the data is negative, surface it directly.
Use simple language and avoid hype.
Mask sensitive words with "***" in user-facing text.
Return valid JSON only.

Turn the latest YouTube video and its comments into one compact insight payload.
Output exactly one object with sentimentCard, topThemes, needsAttention, and nextContentMove.
sentimentCard must include positivePercent, dominantTone, subtext, and split.
split must have exactly 3 items with tone and value.
topThemes should be the strongest recurring audience patterns.
needsAttention should only include the most important friction points.
nextContentMove should be the single best next move.
Keep everything short and plain.
`.trim();

const buildUserPrompt = (payload: unknown) => {
  const totalComments =
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { comments?: unknown }).comments)
      ? (payload as { comments: unknown[] }).comments.length
      : null;

  return `
Prompt version: ${PROMPT_VERSION}

Analyze the latest YouTube video and comments below. Return JSON only.
${totalComments !== null ? `- Total comments provided in this input: ${totalComments}. Any theme counts must stay within this comment pool.` : ""}

${JSON.stringify(payload, null, 2)}
`.trim();
};

const hashValue = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

const loadInsightContext = async (userId: string) => {
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, userId),
  });

  if (!account) {
    throw new Error("YouTube account is not connected");
  }

  const latestVideo = await db.query.videos.findFirst({
    where: eq(videos.userId, userId),
    orderBy: desc(videos.publishedAt),
  });

  const latestComments = latestVideo
    ? await db.query.comments.findMany({
        where: eq(comments.videoId, latestVideo.id),
        orderBy: [desc(comments.publishedAt), desc(comments.createdAt)],
      })
    : [];

  return {
    channel: {
      id: account.channelId,
      title: account.channelName,
      lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
    },
    video: latestVideo
      ? {
          id: latestVideo.id,
          youtubeVideoId: latestVideo.youtubeVideoId,
          title: latestVideo.title,
          publishedAt: latestVideo.publishedAt?.toISOString() ?? null,
          thumbnailUrl: latestVideo.thumbnailUrl,
          viewCount: latestVideo.viewCount,
          likeCount: latestVideo.likeCount,
          favoriteCount: latestVideo.favoriteCount,
          commentCount: latestVideo.commentCount,
          duration: latestVideo.duration,
        }
      : null,
    comments: latestComments.map((comment) => ({
      id: comment.id,
      videoId: comment.videoId,
      youtubeCommentId: comment.youtubeCommentId,
      text: comment.text,
      publishedAt: comment.publishedAt?.toISOString() ?? null,
      likeCount: comment.likeCount,
    })),
  };
};

const persistInsightArtifact = async (input: {
  userId: string;
  sourceHash: string;
  rawInput: unknown;
  payload: unknown;
  rawOutput: string;
}) => {
  const now = new Date();
  const artifact = {
    userId: input.userId,
    sourceHash: input.sourceHash,
    model: MODEL,
    promptVersion: PROMPT_VERSION,
    status: "completed",
    payloadJson: input.payload,
    rawInputJson: input.rawInput,
    rawOutputJson: input.rawOutput,
    errorMessage: null,
    updatedAt: now,
  };

  await db
    .insert(insightArtifacts)
    .values(artifact)
    .onConflictDoUpdate({
      target: [insightArtifacts.userId],
      set: artifact,
    });
};

const getInsightState = async (userId: string) => {
  const rawInput = await loadInsightContext(userId);
  const existing = await db.query.insightArtifacts.findFirst({
    where: eq(insightArtifacts.userId, userId),
  });
  const currentCommentCount =
    rawInput &&
    typeof rawInput === "object" &&
    Array.isArray((rawInput as { comments?: unknown }).comments)
      ? (rawInput as { comments: unknown[] }).comments.length
      : 0;
  const previousCommentCount =
    existing &&
    existing.rawInputJson &&
    typeof existing.rawInputJson === "object" &&
    Array.isArray((existing.rawInputJson as { comments?: unknown }).comments)
      ? (existing.rawInputJson as { comments: unknown[] }).comments.length
      : 0;

  const newCommentsSinceLastAnalysis = Math.max(
    0,
    currentCommentCount - previousCommentCount,
  );

  return {
    rawInput,
    existing,
    currentCommentCount,
    newCommentsSinceLastAnalysis,
    canRegenerate:
      !existing ||
      existing.promptVersion !== PROMPT_VERSION ||
      existing.model !== MODEL ||
      newCommentsSinceLastAnalysis >= REGEN_THRESHOLD,
    regenerationThreshold: REGEN_THRESHOLD,
  };
};

const formatArtifact = (artifact: typeof insightArtifacts.$inferSelect) => ({
  id: artifact.id,
  sourceHash: artifact.sourceHash,
  model: artifact.model,
  promptVersion: artifact.promptVersion,
  status: artifact.status,
  payload: VideoPayloadSchema.parse(artifact.payloadJson),
  createdAt: artifact.createdAt,
  updatedAt: artifact.updatedAt,
});

export const generateInsightForUser = async (input: {
  userId: string;
  forceRefresh?: boolean;
}) => {
  const state = await getInsightState(input.userId);
  const sourceHash = hashValue({
    rawInput: state.rawInput,
    promptVersion: PROMPT_VERSION,
    model: MODEL,
  });

  if (!input.forceRefresh) {
    if (
      state.existing?.sourceHash === sourceHash &&
      state.existing.payloadJson
    ) {
      return formatArtifact(state.existing);
    }

    if (state.existing?.payloadJson && !state.canRegenerate) {
      return formatArtifact(state.existing);
    }
  }

  const result = await generateStructuredJson({
    schemaName: "croudq_insight",
    schema: insightJsonSchema,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(state.rawInput),
    maxOutputTokens: 2200,
  });

  const payload = VideoPayloadSchema.parse(result.parsedJson);

  await persistInsightArtifact({
    userId: input.userId,
    sourceHash,
    rawInput: state.rawInput,
    payload,
    rawOutput: result.outputText,
  });

  const stored = await db.query.insightArtifacts.findFirst({
    where: eq(insightArtifacts.userId, input.userId),
  });
  if (!stored) {
    throw new Error("Failed to load stored insight artifact");
  }

  return formatArtifact(stored);
};

export const refreshYoutubeInsightsForUser = async (input: {
  userId: string;
  forceRefresh?: boolean;
}) => {
  const state = await getInsightState(input.userId);

  if (state.currentCommentCount === 0) {
    return [];
  }

  return [
    await generateInsightForUser({
      userId: input.userId,
      forceRefresh: input.forceRefresh,
    }),
  ];
};

export const getStoredInsightState = async (input: { userId: string }) => {
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, input.userId),
  });

  if (!account) {
    return {
      hasYoutubeAccount: false,
      artifact: null,
      hasAnalysis: false,
      currentCommentCount: 0,
      regenerationThreshold: 0,
      canRegenerate: false,
    };
  }

  const [stats] = await db
    .select({
      totalView: videos.viewCount,
      totalLikes: videos.likeCount,
      videoTitle: videos.title,
    })
    .from(videos)
    .where(eq(videos.userId, input.userId));

  const state = await getInsightState(input.userId);
  const baseState = {
    viewsCount: stats?.totalView ?? 0,
    likesCount: stats?.totalLikes ?? 0,
    channelName: account.channelName,
    videoTitle: stats.videoTitle,
    hasYoutubeAccount: true,
    currentCommentCount: state.currentCommentCount,
    regenerationThreshold: state.regenerationThreshold,
    canRegenerate: state.canRegenerate,
  };

  if (state.currentCommentCount === 0) {
    return {
      ...baseState,
      artifact: null,
      hasAnalysis: false,
      canRegenerate: false,
    };
  }

  if (!state.existing?.payloadJson) {
    return {
      ...baseState,
      artifact: await generateInsightForUser({
        userId: input.userId,
      }),
      hasAnalysis: true,
    };
  }

  return {
    ...baseState,
    artifact: formatArtifact(state.existing),
    hasAnalysis: true,
  };
};
