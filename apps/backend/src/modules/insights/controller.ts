import { desc, eq } from "drizzle-orm";
import { InsightPayloadSchema } from "./dto";

import { db } from "../../db";
import {
  comments,
  insightArtifacts,
  videos,
  youtubeAccounts,
} from "../../db/schema";
import { generateStructuredJson } from "../ai/controller";

type InsightState = {
  viewsCount: number;
  likesCount: number;
  channelName: string | null;
  videoTitle: string | null;
  hasYoutubeAccount: boolean;
  artifact: ReturnType<typeof formatArtifact> | null;
  hasAnalysis: boolean;
  currentCommentCount: number;
  regenerationThreshold: number;
  canRegenerate: boolean;
};

const MODEL = "gpt-5-mini";
const PROMPT_VERSION = "2026-04-04.v01";
const REGEN_THRESHOLD = 5;

// Defines the structure of the AI's JSON response
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

const buildUserPrompt = (payload: { comments: unknown[] }) => {
  return `
Prompt version: ${PROMPT_VERSION}

Analyze the latest YouTube video and comments below. Return JSON only.
- Total comments provided in this input: ${payload.comments.length}. Any theme counts must stay within this comment pool.

${JSON.stringify(payload, null, 2)}
`.trim();
  // convert object to string for prompt
};

const saveInsight = async (input: {
  userId: string;
  analyzedCommentCount: number;
  payload: unknown;
}) => {
  const now = new Date();
  const artifact = {
    userId: input.userId,
    model: MODEL,
    promptVersion: PROMPT_VERSION,
    status: "completed",
    payloadJson: input.payload,
    analyzedCommentCount: input.analyzedCommentCount,
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

//Format stored artifacts for api response
const formatArtifact = (artifact: typeof insightArtifacts.$inferSelect) => ({
  id: artifact.id,
  model: artifact.model,
  promptVersion: artifact.promptVersion,
  status: artifact.status,
  payload: InsightPayloadSchema.parse(artifact.payloadJson),
  createdAt: artifact.createdAt,
  updatedAt: artifact.updatedAt,
});

export const generateInsightForUser = async (
  userId: string,
  state: Awaited<ReturnType<typeof getInsightState>>,
) => {
  const result = await generateStructuredJson({
    schemaName: "croudq_insight",
    schema: insightJsonSchema,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(state.rawInput),
    maxOutputTokens: 2200,
  });

  const payload = InsightPayloadSchema.parse(result.parsedJson);

  await saveInsight({
    userId: userId,
    analyzedCommentCount: state.currentCommentCount,
    payload,
  });

  const stored = await db.query.insightArtifacts.findFirst({
    where: eq(insightArtifacts.userId, userId),
  });

  if (!stored) {
    throw new Error("Failed to load stored insight artifact");
  }

  return formatArtifact(stored);
};

//keeps track of a running request to prevent duplicate requests
const runningInsightRequests = new Map<string, Promise<InsightState>>();

export const getStoredInsightState = async (input: {
  userId: string;
  forceRefresh: boolean;
}) => {
  const existingRequest = runningInsightRequests.get(input.userId);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const account = await db.query.youtubeAccounts.findFirst({
      where: eq(youtubeAccounts.userId, input.userId),
    });

    if (!account) {
      return {
        viewsCount: 0,
        likesCount: 0,
        channelName: null,
        videoTitle: null,
        hasYoutubeAccount: false,
        artifact: null,
        hasAnalysis: false,
        currentCommentCount: 0,
        regenerationThreshold: 0,
        canRegenerate: false,
      };
    }

    const state = await getInsightState(input.userId);
    const baseState = {
      viewsCount: state?.rawInput.video?.viewCount ?? 0,
      likesCount: state?.rawInput.video?.likeCount ?? 0,
      channelName: account.channelName,
      videoTitle: state.rawInput.video?.title ?? null,
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

    if (
      !state.existing?.payloadJson ||
      (input.forceRefresh && state.canRegenerate)
    ) {
      return {
        ...baseState,
        artifact: await generateInsightForUser(input.userId, state),
        hasAnalysis: true,
      };
    }

    return {
      ...baseState,
      artifact: formatArtifact(state.existing),
      hasAnalysis: true,
    };
  })();

  runningInsightRequests.set(input.userId, request);

  try {
    return await request;
  } finally {
    runningInsightRequests.delete(input.userId);
  }
};

const getInsightState = async (userId: string) => {
  const rawInput = await loadInsightContext(userId);
  const existing = await db.query.insightArtifacts.findFirst({
    where: eq(insightArtifacts.userId, userId),
  });
  const currentCommentCount = rawInput.comments.length;
  const previousCommentCount = existing?.analyzedCommentCount ?? 0;

  const newCommentsSinceLastAnalysis = Math.max(
    0,
    currentCommentCount - previousCommentCount,
  );

  return {
    rawInput,
    existing,
    currentCommentCount,
    canRegenerate:
      !existing ||
      existing.promptVersion !== PROMPT_VERSION ||
      existing.model !== MODEL ||
      newCommentsSinceLastAnalysis >= REGEN_THRESHOLD,
    regenerationThreshold: REGEN_THRESHOLD,
  };
};

//loads all the videos data like comments and meta data for ai input
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
      title: account.channelName,
    },
    video: latestVideo
      ? {
          title: latestVideo.title,
          publishedAt: latestVideo.publishedAt?.toISOString() ?? null,
          viewCount: latestVideo.viewCount,
          likeCount: latestVideo.likeCount,
          duration: latestVideo.duration,
        }
      : null,
    comments: latestComments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      likeCount: comment.likeCount,
    })),
  };
};
