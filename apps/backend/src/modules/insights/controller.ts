import { createHash } from "crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../db";
import { comments, insightArtifacts, videos, youtubeAccounts } from "../../db/schema";
import { generateStructuredJson } from "../ai/controller";
import { buildDashboardOverviewStats } from "../overviewstats/controller";
import { dashboardOverviewStatSchema } from "../overviewstats/dto";
import { syncStoredVideoCommentsForAnalysis } from "../youtube-sync/controller";
import { getChannelLimitsForUser } from "../youtube-sync/channel-limits";
import { VIDEO_COMMENTS_SYNC_COOLDOWN_MS } from "../youtube-sync/constants";
import { YoutubeRouteError } from "../youtube-errors/controller";

export const insightPlatform = "youtube" as const;
export const insightModel = "gpt-5-mini" as const;
const PROMPT_VERSION = "2026-04-04.v01";
const AGGREGATE_ANALYSIS_VIDEO_LIMIT = 1;

export const dashboardScope = "dashboard" as const;
export const commentsScope = "comments" as const;
export const strategyScope = "strategy" as const;
export const videoDetailScope = "video_detail" as const;

const overviewStatsSchema = z.array(dashboardOverviewStatSchema).length(4);

export const dashboardPayloadSchema = z.object({
  insightCards: z.array(
    z.object({
      id: z.string(),
      badgeLabel: z.string().min(1).max(24).optional(),
      metric: z.string(),
      title: z.string(),
      tone: z.enum(["positive", "negative", "active", "neutral"]),
    }),
  ).min(1).max(4),
  overviewStats: overviewStatsSchema,
  sentimentCard: z.object({
    positivePercent: z.number().int().min(0).max(100),
    dominantTone: z.enum(["positive", "neutral", "negative"]),
    subtext: z.string(),
    split: z.array(
      z.object({
        tone: z.enum(["positive", "neutral", "negative"]),
        value: z.number().int().min(0).max(100),
      }),
    ).min(3).max(3),
  }),
});

const dashboardAiPayloadSchema = z.object({
  insightCards: z.array(
    z.object({
      id: z.string(),
      badgeLabel: z.string().min(1).max(24),
      metric: z.string(),
      title: z.string(),
      tone: z.enum(["positive", "negative", "active", "neutral"]),
    }),
  ).min(1).max(4),
  sentimentCard: z.object({
    positivePercent: z.number().min(0).max(100),
    neutralPercent: z.number().min(0).max(100),
    negativePercent: z.number().min(0).max(100),
    subtext: z.string(),
  }),
});

export const commentsPayloadSchema = z.object({
  pulse: z.string(),
  topThemes: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      count: z.number().int().nonnegative(),
      quotes: z.array(z.string()).max(3),
    }),
  ).max(15),
  needsAttention: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      implication: z.string(),
    }),
  ).max(5),
});

export const strategyPayloadSchema = z.object({
  topSignal: z.object({
    title: z.string(),
    evidence: z.array(z.string()).max(4),
    actionHint: z.string(),
    priority: z.enum(["High impact", "Quick win", "Needs fixing"]),
    evidenceLine: z.string(),
  }),
  recurringFriction: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      context: z.string(),
      tag: z.enum(["High impact", "Needs fixing"]),
    }),
  ).max(4),
  nextContentMove: z.object({
    title: z.string(),
    steps: z.array(z.string()).max(3),
    reasons: z.array(z.string()).max(3),
    tag: z.enum(["High impact", "Quick win", "Needs fixing"]),
    evidenceLine: z.string(),
  }),
});

export const videoDetailPayloadSchema = z.object({
  sentimentSummary: z.object({
    dominantTone: z.enum(["positive", "neutral", "negative", "unavailable"]),
    copy: z.string(),
    split: z.array(
      z.object({
        tone: z.enum(["positive", "neutral", "negative"]),
        value: z.number().int().min(0).max(100),
      }),
    ).min(3).max(3),
  }),
  commentClusters: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      count: z.number().int().nonnegative(),
      preview: z.array(z.string()).max(3),
    }),
  ).max(15),
  aiSuggestions: z.array(z.string()).max(5),
});

const videoDetailAiPayloadSchema = z.object({
  sentimentSummary: z.object({
    positivePercent: z.number().min(0).max(100),
    neutralPercent: z.number().min(0).max(100),
    negativePercent: z.number().min(0).max(100),
    copy: z.string(),
  }),
  commentClusters: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      count: z.number().int().nonnegative(),
      preview: z.array(z.string()).max(3),
    }),
  ).max(15),
  aiSuggestions: z.array(z.string()).max(5),
});

const artifactPayloadSchema = z.discriminatedUnion("scope", [
  z.object({
    scope: z.literal(dashboardScope),
    payload: dashboardPayloadSchema,
  }),
  z.object({
    scope: z.literal(commentsScope),
    payload: commentsPayloadSchema,
  }),
  z.object({
    scope: z.literal(strategyScope),
    payload: strategyPayloadSchema,
  }),
  z.object({
    scope: z.literal(videoDetailScope),
    payload: videoDetailPayloadSchema,
  }),
]);

const dashboardJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "insightCards",
    "sentimentCard",
  ],
  properties: {
    insightCards: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "badgeLabel", "metric", "title", "tone"],
        properties: {
          id: { type: "string" },
          badgeLabel: { type: "string" },
          metric: { type: "string" },
          title: { type: "string" },
          tone: {
            type: "string",
            enum: ["positive", "negative", "active", "neutral"],
          },
        },
      },
    },
    sentimentCard: {
      type: "object",
      additionalProperties: false,
      required: [
        "positivePercent",
        "neutralPercent",
        "negativePercent",
        "subtext",
      ],
      properties: {
        positivePercent: { type: "number" },
        neutralPercent: { type: "number" },
        negativePercent: { type: "number" },
        subtext: { type: "string" },
      },
    },
  },
} as const;

const commentsJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "pulse",
    "topThemes",
    "needsAttention",
  ],
  properties: {
    pulse: { type: "string" },
    topThemes: {
      type: "array",
      maxItems: 15,
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
  },
} as const;

const strategyJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "topSignal",
    "recurringFriction",
    "nextContentMove",
  ],
  properties: {
    topSignal: {
      type: "object",
      additionalProperties: false,
      required: ["title", "evidence", "actionHint", "priority", "evidenceLine"],
      properties: {
        title: { type: "string" },
        evidence: {
          type: "array",
          maxItems: 4,
          items: { type: "string" },
        },
        actionHint: { type: "string" },
        priority: {
          type: "string",
          enum: ["High impact", "Quick win", "Needs fixing"],
        },
        evidenceLine: { type: "string" },
      },
    },
    recurringFriction: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "context", "tag"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          context: { type: "string" },
          tag: {
            type: "string",
            enum: ["High impact", "Needs fixing"],
          },
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
} as const;

const videoDetailJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "sentimentSummary",
    "commentClusters",
    "aiSuggestions",
  ],
  properties: {
    sentimentSummary: {
      type: "object",
      additionalProperties: false,
      required: ["positivePercent", "neutralPercent", "negativePercent", "copy"],
      properties: {
        positivePercent: { type: "number" },
        neutralPercent: { type: "number" },
        negativePercent: { type: "number" },
        copy: { type: "string" },
      },
    },
    commentClusters: {
      type: "array",
      maxItems: 15,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "count", "preview"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          count: { type: "integer" },
          preview: {
            type: "array",
            maxItems: 3,
            items: { type: "string" },
          },
        },
      },
    },
    aiSuggestions: {
      type: "array",
      maxItems: 5,
      items: { type: "string" },
    },
  },
} as const;

type InsightScope =
  | typeof dashboardScope
  | typeof commentsScope
  | typeof strategyScope
  | typeof videoDetailScope;

type AggregateInsightScope =
  | typeof dashboardScope
  | typeof commentsScope
  | typeof strategyScope;

const aggregateScopes: readonly AggregateInsightScope[] = [
  dashboardScope,
  commentsScope,
  strategyScope,
];

const isAggregateScope = (scope: InsightScope): scope is AggregateInsightScope =>
  aggregateScopes.includes(scope as AggregateInsightScope);

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const keys = Object.keys(objectValue).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(objectValue[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
};

const hashValue = (value: unknown) =>
  createHash("sha256").update(stableSerialize(value)).digest("hex");

const SENTIMENT_TONES = [
  "positive",
  "neutral",
  "negative",
] as const;

const baseSystemPrompt = `
You are CroudQ's insight engine for creators.

Rules:
- Use only the provided data.
- Do not invent facts, timelines, or metrics.
- If evidence is weak, mixed, or limited, say so through the relevant fields instead of overstating confidence.
- If the data shows a clear downside, problem, drop, complaint pattern, or weak result, surface it plainly. Do not soften or skip it.
- Be balanced: do not force positivity, but do not exaggerate negativity either.
- Prioritize accuracy and usefulness over sounding nice.
- Keep outputs concise, specific, and ready for mobile UI.
- Do not produce super lengthy text in any field.
- Keep text tight and controlled. Avoid long explanations, stacked clauses, or paragraph-like output.
- Any item limit is a maximum, not a target.
- Return only the strongest supported items. Prefer fewer items or empty arrays over filler.
- Stay scoped to recent YouTube performance and comment patterns for this creator.
- Use plain creator-performance language, not generic coaching language, marketing language, or jargon.
- Use everyday wording. Do not sound formal, literary, corporate, or overly polished.
- Avoid extreme wording, exaggerated adjectives, dramatic verbs, and dictionary-style phrasing.
- Prefer simple words a normal creator would naturally say in conversation.
- Do not use broad marketing phrasing like "CTA", "conversion play", "growth hack", "funnel", or similar shorthand unless the input clearly requires it.
- Tone should be straightforward, friendly, practical, and genuinely useful to a creator.
- Do not use hype, inflated claims, dramatic framing, or empty praise.
- When referring to a specific video, use a short title-based hint grounded in the real title.
- If text derived from comments includes abusive, hateful, sexual, or otherwise sensitive words, mask the sensitive part with "***".
- Preserve readable context when possible, but never leave explicit abusive wording fully visible.
- Never put masked profanity into labels, titles, headings, card names, or cluster names. Rewrite those cleanly.
- In summaries, implications, pulse lines, and issue descriptions, rewrite the idea cleanly instead of using masked profanity tokens.
- Never say that a word was "masked", "censored", "redacted", or "hidden" in user-facing copy.
- Apply the masking silently. The output should read naturally, without mentioning the masking process itself.
- Do not mention tools, prompts, LLMs, schemas, JSON, or internal system behavior.
- Do not recommend tactics that are not grounded in the provided data.
- Return valid JSON that matches the required schema exactly.
`.trim();

const scopeInstructions: Record<InsightScope, string> = {
  [dashboardScope]: `
Goal:
- Summarize the clearest recent signals for the home dashboard.

Field rules:
- insightCards: return 1 to 4 strong signals.
- insightCards.badgeLabel: very short badge text, ideally 1 to 3 words, and keep it under 20 letters total whenever possible.
- insightCards.metric: compact signal phrase, ideally 2 to 6 words, never a sentence.
- insightCards.title: short headline, ideally under 12 words, clear and concrete.
- First card is the large hero card. Keep it compact, but it can be slightly richer than the smaller cards.
- Supporting carousel cards should still read cleanly at a glance.
- For supporting carousel cards only, keep insightCards.metric to 20 letters or fewer total across all words.
- Use normal creator-friendly wording there, not cryptic abbreviations or shorthand that a creator may not understand.
- Do not let badgeLabel and title disagree. If the card is mixed, cautious, or early-stage, badgeLabel should say that plainly.
- sentimentCard: return positivePercent, neutralPercent, negativePercent, and subtext based on the actual recent comment mix.
- sentimentCard.subtext: 1 short sentence or 2 very short sentences, compact enough for about 4 lines on mobile.

Decision rules:
- Rank cards by likely usefulness to the creator's next move.
- Keep only the highest-signal cards.
- If a negative or weak signal is one of the clearest signals, include it directly instead of preferring a softer positive angle.
- Do not include generic advice that could apply to almost any creator.
- Prefer specific observations over polished-sounding wording.
- Do not make card copy overly long.
`.trim(),
  [commentsScope]: `
Goal:
- Turn recent raw comments into a clear audience-read for the comments screen.

Field rules:
- pulse: one compact line that summarizes the overall audience feel.
- topThemes: strongest recurring audience patterns, with counts and quote previews.
- topThemes.title: crisp audience signal, not a generic topic label.
- topThemes.count must reflect distinct comments, not vague strength or overlap.
- needsAttention: only the most important friction points for the creator.
- Use clean rewritten language for pulse, topThemes.title, and needsAttention. Do not use masked profanity there.
- If quote previews include abusive or explicit wording, mask only the sensitive part and keep the preview readable.

Decision rules:
- Rank topThemes by recurrence and signal strength.
- Do not count the same comment in multiple topThemes.
- The combined total of all topThemes.count values must not exceed the total number of comments provided.
- Rank needsAttention by creator impact and urgency.
- If comments show a clear negative pattern, unmet expectation, confusion, or complaint, surface it directly.
- Do not avoid negative or critical comment patterns when they are clearly present.
- Do not create a theme or issue from a weak one-off comment unless it clearly matters.
- Prefer non-overlapping items. Do not repeat the same point with slightly different wording.
- Return empty arrays when the evidence is too weak.
- Prefer clean, direct observations over softened or diplomatic phrasing.
- Do not make pulse or needs-attention copy overly long.
`.trim(),
  [strategyScope]: `
Goal:
- Turn recent video and comment data into strategic guidance for what matters most next.

Field rules:
- topSignal: strongest overall signal from the recent data. It should feel like the one thing the creator most needs to understand first.
- recurringFriction: recurring problems hurting performance, clarity, payoff, or audience response.
- nextContentMove: concrete recommendation for the next post. Make it specific, realistic, and creator-usable.
- nextContentMove.steps: at most 3 clear steps.
- nextContentMove.reasons: at most 3 clear reasons.

Decision rules:
- Keep recurringFriction focused on real repeated problems, not speculative issues.
- If the strongest strategic takeaway is negative, say it plainly and make it actionable.
- Return an empty recurringFriction array when the evidence is weak.
- Do not manufacture friction just to create balance.
- Keep recommendations practical and grounded, not lofty or aspirational.
- Do not make summaries, actions, or recommendations overly long.
`.trim(),
  [videoDetailScope]: `
Goal:
- Analyze one video's comment mood, clusters, and next-step suggestions.

Field rules:
- sentimentSummary: return positivePercent, neutralPercent, and negativePercent from the actual comment mix for this video.
- sentimentSummary.copy: concise explanation of the mood signal, plain and direct.
- If there are not enough meaningful comments to judge mood, return 0 for all three sentiment percentages.
- commentClusters: main recurring things viewers were saying about this video.
- commentClusters.count must reflect distinct comments, not vague strength or overlap.
- commentClusters.preview: preserve readable context, but mask abusive or explicit words with "***".
- aiSuggestions: concrete, meaningful, value-adding next improvements for a future cut, follow-up, framing, or comment strategy.
- aiSuggestions: usually return only 1 to 3 items.
- Return 4 or 5 suggestions only when each one is clearly distinct, strongly supported by the data, and genuinely high value.

Decision rules:
- Estimate sentiment from the full provided comment set as accurately as possible.
- If evidence is mixed, uncertain, or limited, reflect that honestly instead of forcing a dramatic mood split.
- Do not fake a sentiment split when the sample is too small or inconclusive.
- If the comments lean clearly negative or frustrated, reflect that plainly in sentimentSummary.copy and clusters.
- Rank commentClusters and aiSuggestions by signal strength and likely usefulness.
- Do not count the same comment in multiple commentClusters.
- The combined total of all commentClusters.count values must not exceed the total number of comments provided.
- Each aiSuggestion should give the creator a genuinely helpful next move, not filler or generic advice.
- Prefer fewer strong suggestions over filling the list.
- Do not restate the same advice in slightly different wording.
- Do not include low-confidence, low-impact, obvious, or generic suggestions just because there is room in the array.
- If only one strong next move is clear, return one item.
- Return empty arrays when the evidence is too weak.
- Prefer precise, creator-usable advice over polished wording.
- Do not make mood copy, cluster previews, or suggestions overly long.
`.trim(),
};

const buildUserPrompt = (scope: InsightScope, payload: unknown) => {
  const totalComments =
    payload && typeof payload === "object" && Array.isArray((payload as { comments?: unknown }).comments)
      ? (payload as { comments: unknown[] }).comments.length
      : null;

  return `
Scope: ${scope}
Prompt version: ${PROMPT_VERSION}

Analyze the following raw synced CroudQ YouTube data and return JSON only.

App context:
- CroudQ turns recent YouTube performance and comment data into compact mobile insights.
- Write for in-product cards and sections, not for a memo or report.
- Help the creator quickly see what happened, why it matters, and what to try next.
- Be clear and useful, not flashy or over-written.
- Sound like clear, practical content insight for a creator, not a marketer and not a motivational coach.
${totalComments !== null ? `- Total comments provided in this input: ${totalComments}. Any theme or cluster counts must stay within this comment pool.` : ""}

${JSON.stringify(payload, null, 2)}
`.trim();
};

const roundPercentagesToHundred = (values: number[]) => {
  const safeValues = values.map((value) =>
    Number.isFinite(value) ? Math.max(0, value) : 0,
  );
  const total = safeValues.reduce((sum, value) => sum + value, 0);

  if (total <= 0) {
    return [0, 0, 0];
  }

  const scaled = safeValues.map((value) => (value / total) * 100);
  const floors = scaled.map((value) => Math.floor(value));
  let remainder = 100 - floors.reduce((sum, value) => sum + value, 0);

  const rankedRemainders = scaled
    .map((value, index) => ({
      index,
      remainder: value - floors[index]!,
    }))
    .sort((left, right) => right.remainder - left.remainder);

  for (const item of rankedRemainders) {
    if (remainder <= 0) {
      break;
    }

    floors[item.index] = (floors[item.index] ?? 0) + 1;
    remainder -= 1;
  }

  return floors;
};

const normalizeDashboardPayload = (
  payload: z.infer<typeof dashboardAiPayloadSchema>,
) => {
  const sentimentValues = roundPercentagesToHundred([
    payload.sentimentCard.positivePercent,
    payload.sentimentCard.neutralPercent,
    payload.sentimentCard.negativePercent,
  ]);

  const dominantTone =
    SENTIMENT_TONES[
      sentimentValues.indexOf(Math.max(...sentimentValues))
    ] ?? "neutral";

  return {
    insightCards: payload.insightCards.map((card) => ({
      ...card,
      badgeLabel: card.badgeLabel,
    })),
    sentimentCard: {
      positivePercent: sentimentValues[0] ?? 0,
      dominantTone,
      subtext: payload.sentimentCard.subtext,
      split: SENTIMENT_TONES.map((tone, index) => ({
        tone,
        value: sentimentValues[index] ?? 0,
      })),
    },
  };
};

const getInsightCardBadgeFallback = (
  tone: "positive" | "negative" | "active" | "neutral",
) => {
  switch (tone) {
    case "negative":
      return "Needs attention";
    case "active":
      return "Worth watching";
    case "neutral":
      return "Worth trying";
    default:
      return "Doing well";
  }
};

const normalizeStoredDashboardPayload = (
  payload: {
    insightCards: Array<{
      id: string;
      metric: string;
      title: string;
      tone: "positive" | "negative" | "active" | "neutral";
      badgeLabel?: string;
    }>;
    sentimentCard: {
      positivePercent: number;
      dominantTone: "positive" | "neutral" | "negative";
      subtext: string;
      split: Array<{
        tone: "positive" | "neutral" | "negative";
        value: number;
      }>;
    };
  },
) => ({
  ...payload,
  insightCards: payload.insightCards.map((card) => ({
    ...card,
    badgeLabel: card.badgeLabel ?? getInsightCardBadgeFallback(card.tone),
  })),
});

const normalizeVideoDetailPayload = (
  payload: z.infer<typeof videoDetailAiPayloadSchema>,
) => {
  const sentimentValues = roundPercentagesToHundred([
    payload.sentimentSummary.positivePercent,
    payload.sentimentSummary.neutralPercent,
    payload.sentimentSummary.negativePercent,
  ]);

  const dominantTone =
    sentimentValues.every((value) => value === 0)
      ? "unavailable"
      : (SENTIMENT_TONES[sentimentValues.indexOf(Math.max(...sentimentValues))] ??
        "neutral");

  return {
    sentimentSummary: {
      dominantTone,
      copy: payload.sentimentSummary.copy,
      split: SENTIMENT_TONES.map((tone, index) => ({
        tone,
        value: sentimentValues[index] ?? 0,
      })),
    },
    commentClusters: payload.commentClusters,
    aiSuggestions: payload.aiSuggestions,
  };
};

const loadRecentStoredVideos = async (userId: string) =>
  db.query.videos.findMany({
    where: eq(videos.userId, userId),
    orderBy: desc(videos.publishedAt),
    limit: AGGREGATE_ANALYSIS_VIDEO_LIMIT,
  });

export const getDashboardAnalysisVideoIds = async (userId: string) =>
  (
    await loadRecentStoredVideos(userId)
  ).map((video) => video.id);

const loadAllStoredVideos = async (userId: string) =>
  db.query.videos.findMany({
    where: eq(videos.userId, userId),
    orderBy: desc(videos.publishedAt),
  });

const loadAggregateInsightContext = async (userId: string) => {
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, userId),
  });

  if (!account) {
    throw new Error("YouTube account is not connected");
  }

  const storedVideos = await loadRecentStoredVideos(userId);

  const storedComments = storedVideos.length
    ? await db.query.comments.findMany({
        where: inArray(
          comments.videoId,
          storedVideos.map((video) => video.id),
        ),
        orderBy: [desc(comments.publishedAt), desc(comments.createdAt)],
      })
    : [];

  return {
    channel: {
      id: account.channelId,
      title: account.channelName,
      lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
    },
    videos: storedVideos.map((video) => ({
      id: video.id,
      youtubeVideoId: video.youtubeVideoId,
      title: video.title,
      publishedAt: video.publishedAt?.toISOString() ?? null,
      thumbnailUrl: video.thumbnailUrl,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      favoriteCount: video.favoriteCount,
      commentCount: video.commentCount,
      duration: video.duration,
    })),
    comments: storedComments.map((comment) => ({
      id: comment.id,
      videoId: comment.videoId,
      youtubeCommentId: comment.youtubeCommentId,
      text: comment.text,
      publishedAt: comment.publishedAt?.toISOString() ?? null,
      likeCount: comment.likeCount,
    })),
  };
};

const buildDeterministicDashboardOverviewStats = async (userId: string) => {
  const allStoredVideos = await loadAllStoredVideos(userId);

  return overviewStatsSchema.parse(buildDashboardOverviewStats(allStoredVideos));
};

const normalizeStrategyPayload = (payload: unknown) =>
  strategyPayloadSchema.parse({
    ...(payload && typeof payload === "object" ? payload : {}),
    recurringFriction: Array.isArray(
      payload && typeof payload === "object"
        ? (payload as { recurringFriction?: unknown }).recurringFriction
        : undefined,
    )
      ? (
          payload as {
            recurringFriction: Array<{
              id?: unknown;
              title?: unknown;
              context?: unknown;
              tag?: unknown;
            }>;
          }
        ).recurringFriction.map((item) => ({
          id: item.id,
          title: item.title,
          context: item.context,
          tag: item.tag,
        }))
      : [],
  });

const loadVideoInsightContext = async (userId: string, videoId: string) => {
  const account = await db.query.youtubeAccounts.findFirst({
    where: eq(youtubeAccounts.userId, userId),
  });

  if (!account) {
    throw new Error("YouTube account is not connected");
  }

  const selectedVideo = await db.query.videos.findFirst({
    where: and(eq(videos.userId, userId), eq(videos.id, videoId)),
  });

  if (!selectedVideo) {
    throw new Error("Video not found");
  }

  const videoComments = await db.query.comments.findMany({
    where: eq(comments.videoId, videoId),
    orderBy: [desc(comments.publishedAt), desc(comments.createdAt)],
  });

  return {
    channel: {
      id: account.channelId,
      title: account.channelName,
      lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
    },
    video: {
      id: selectedVideo.id,
      youtubeVideoId: selectedVideo.youtubeVideoId,
      title: selectedVideo.title,
      publishedAt: selectedVideo.publishedAt?.toISOString() ?? null,
      thumbnailUrl: selectedVideo.thumbnailUrl,
      viewCount: selectedVideo.viewCount,
      likeCount: selectedVideo.likeCount,
      favoriteCount: selectedVideo.favoriteCount,
      commentCount: selectedVideo.commentCount,
      duration: selectedVideo.duration,
    },
    comments: videoComments.map((comment) => ({
      id: comment.id,
      videoId: comment.videoId,
      youtubeCommentId: comment.youtubeCommentId,
      text: comment.text,
      publishedAt: comment.publishedAt?.toISOString() ?? null,
      likeCount: comment.likeCount,
    })),
  };
};

const buildScopeInput = async (
  userId: string,
  scope: InsightScope,
  scopeRefId = "",
) => {
  if (scope === videoDetailScope) {
    if (!scopeRefId) {
      throw new Error("Video insight requires a video id");
    }

    return loadVideoInsightContext(userId, scopeRefId);
  }

  return loadAggregateInsightContext(userId);
};

const getSchemaConfig = (scope: InsightScope) => {
  switch (scope) {
    case dashboardScope:
      return {
        schemaName: "croudq_dashboard",
        schema: dashboardJsonSchema,
        validator: dashboardAiPayloadSchema,
      };
    case commentsScope:
      return {
        schemaName: "croudq_comments",
        schema: commentsJsonSchema,
        validator: commentsPayloadSchema,
      };
    case strategyScope:
      return {
        schemaName: "croudq_strategy",
        schema: strategyJsonSchema,
        validator: strategyPayloadSchema,
      };
    case videoDetailScope:
      return {
        schemaName: "croudq_video_detail",
        schema: videoDetailJsonSchema,
        validator: videoDetailAiPayloadSchema,
      };
  }
};

const persistArtifact = async (input: {
  userId: string;
  scope: InsightScope;
  scopeRefId?: string;
  sourceHash: string;
  rawInput: unknown;
  payload: unknown;
  rawOutput: string;
}) => {
  const now = new Date();

  await db
    .insert(insightArtifacts)
    .values({
      userId: input.userId,
      platform: insightPlatform,
      scope: input.scope,
      scopeRefId: input.scopeRefId ?? "",
      sourceHash: input.sourceHash,
      model: insightModel,
      promptVersion: PROMPT_VERSION,
      status: "completed",
      payloadJson: input.payload,
      rawInputJson: input.rawInput,
      rawOutputJson: input.rawOutput,
      errorMessage: null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        insightArtifacts.userId,
        insightArtifacts.platform,
        insightArtifacts.scope,
        insightArtifacts.scopeRefId,
      ],
      set: {
        sourceHash: input.sourceHash,
        model: insightModel,
        promptVersion: PROMPT_VERSION,
        status: "completed",
        payloadJson: input.payload,
        rawInputJson: input.rawInput,
        rawOutputJson: input.rawOutput,
        errorMessage: null,
        updatedAt: now,
      },
    });
};

const getStoredArtifact = async (
  userId: string,
  scope: InsightScope,
  scopeRefId = "",
) =>
  db.query.insightArtifacts.findFirst({
    where: and(
      eq(insightArtifacts.userId, userId),
      eq(insightArtifacts.platform, insightPlatform),
      eq(insightArtifacts.scope, scope),
      eq(insightArtifacts.scopeRefId, scopeRefId),
    ),
  });

const extractCommentCountFromRawInput = (rawInput: unknown) => {
  if (!rawInput || typeof rawInput !== "object") {
    return 0;
  }

  const candidate = rawInput as {
    comments?: unknown;
  };

  return Array.isArray(candidate.comments) ? candidate.comments.length : 0;
};

const extractVideoReportedCommentCountFromRawInput = (rawInput: unknown) => {
  if (!rawInput || typeof rawInput !== "object") {
    return null;
  }

  const candidate = rawInput as {
    video?: {
      commentCount?: unknown;
    };
  };

  return typeof candidate.video?.commentCount === "number"
    ? candidate.video.commentCount
    : null;
};

const extractVideoIdsFromRawInput = (rawInput: unknown) => {
  if (!rawInput || typeof rawInput !== "object") {
    return [] as string[];
  }

  const candidate = rawInput as {
    videos?: Array<{ id?: unknown }> | unknown;
  };

  if (!Array.isArray(candidate.videos)) {
    return [] as string[];
  }

  return candidate.videos
    .map((video) =>
      video && typeof video === "object" && typeof video.id === "string"
        ? video.id
        : null,
    )
    .filter((videoId): videoId is string => Boolean(videoId));
};

const sameVideoWindow = (left: string[], right: string[]) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((videoId, index) => videoId === right[index]);
};

const extractContextMetaFromArtifact = (
  artifact: typeof insightArtifacts.$inferSelect | undefined,
) => ({
  existingPromptVersion: artifact?.promptVersion ?? null,
  existingModel: artifact?.model ?? null,
  previousCommentCount: artifact
    ? extractCommentCountFromRawInput(artifact.rawInputJson)
    : 0,
  previousVideoIds: artifact
    ? extractVideoIdsFromRawInput(artifact.rawInputJson)
    : [],
});

const getAggregateAnalysisState = async (
  userId: string,
  scope: AggregateInsightScope,
) => {
  const channelLimits = await getChannelLimitsForUser(userId);
  const rawInput = await buildScopeInput(userId, scope);
  const existing = await getStoredArtifact(userId, scope, "");
  const {
    previousCommentCount,
    existingPromptVersion,
    existingModel,
    previousVideoIds,
  } =
    extractContextMetaFromArtifact(existing);
  const currentCommentCount = extractCommentCountFromRawInput(rawInput);
  const currentVideoIds = extractVideoIdsFromRawInput(rawInput);
  const newCommentsSinceLastAnalysis = Math.max(
    0,
    currentCommentCount - previousCommentCount,
  );
  const requiresVersionRefresh =
    existingPromptVersion !== null && existingPromptVersion !== PROMPT_VERSION;
  const requiresModelRefresh =
    existingModel !== null && existingModel !== insightModel;
  const requiresVideoWindowRefresh =
    existing !== undefined && !sameVideoWindow(currentVideoIds, previousVideoIds);

  return {
    rawInput,
    existing,
    currentCommentCount,
    previousCommentCount,
    newCommentsSinceLastAnalysis,
    currentVideoIds,
    previousVideoIds,
    requiresVersionRefresh,
    requiresModelRefresh,
    requiresVideoWindowRefresh,
    canRegenerate:
      !existing ||
      requiresVideoWindowRefresh ||
      requiresVersionRefresh ||
      requiresModelRefresh ||
      newCommentsSinceLastAnalysis >= channelLimits.aggregateRegenThreshold,
    regenerationThreshold: channelLimits.aggregateRegenThreshold,
  };
};

const getVideoAnalysisState = async (userId: string, videoId: string) => {
  const channelLimits = await getChannelLimitsForUser(userId);
  const rawInput = await buildScopeInput(userId, videoDetailScope, videoId);
  const existing = await getStoredArtifact(userId, videoDetailScope, videoId);
  const { previousCommentCount, existingPromptVersion, existingModel } =
    extractContextMetaFromArtifact(existing);
  const currentCommentCount = extractCommentCountFromRawInput(rawInput);
  const publicCommentCount = extractVideoReportedCommentCountFromRawInput(rawInput);
  const newCommentsSinceLastAnalysis = Math.max(
    0,
    currentCommentCount - previousCommentCount,
  );
  const requiresVersionRefresh =
    existingPromptVersion !== null && existingPromptVersion !== PROMPT_VERSION;
  const requiresModelRefresh =
    existingModel !== null && existingModel !== insightModel;

  return {
    rawInput,
    existing,
    currentCommentCount,
    publicCommentCount,
    previousCommentCount,
    newCommentsSinceLastAnalysis,
    requiresVersionRefresh,
    requiresModelRefresh,
    canRegenerate:
      !existing ||
      requiresVersionRefresh ||
      requiresModelRefresh ||
      newCommentsSinceLastAnalysis >= channelLimits.videoRegenThreshold,
    regenerationThreshold: channelLimits.videoRegenThreshold,
  };
};

export const generateInsightForScope = async (input: {
  userId: string;
  scope: InsightScope;
  scopeRefId?: string;
  forceRefresh?: boolean;
}) => {
  const scopeRefId = input.scopeRefId ?? "";
  const rawInput = await buildScopeInput(input.userId, input.scope, scopeRefId);
  const sourceHash = hashValue({
    scope: input.scope,
    scopeRefId,
    rawInput,
    promptVersion: PROMPT_VERSION,
    model: insightModel,
  });

  if (!input.forceRefresh) {
    const existing = await getStoredArtifact(input.userId, input.scope, scopeRefId);
    if (existing?.sourceHash === sourceHash && existing.payloadJson) {
      return await formatArtifact(existing);
    }

    if (isAggregateScope(input.scope)) {
      const aggregateState = await getAggregateAnalysisState(
        input.userId,
        input.scope,
      );

      if (
        aggregateState.existing?.payloadJson &&
        !aggregateState.canRegenerate
      ) {
        return await formatArtifact(aggregateState.existing);
      }
    }
  }

  const config = getSchemaConfig(input.scope);
  const result = await generateStructuredJson({
    schemaName: config.schemaName,
    schema: config.schema,
    systemPrompt: `${baseSystemPrompt}\n\n${scopeInstructions[input.scope]}`,
    userPrompt: buildUserPrompt(input.scope, rawInput),
    maxOutputTokens: input.scope === videoDetailScope ? 2600 : 2200,
  });
  const validatedPayload = config.validator.parse(result.parsedJson);
  const payload =
    input.scope === dashboardScope
      ? dashboardPayloadSchema.parse({
          ...normalizeStoredDashboardPayload(normalizeDashboardPayload(
            dashboardAiPayloadSchema.parse(validatedPayload),
          )),
          overviewStats: await buildDeterministicDashboardOverviewStats(
            input.userId,
          ),
        })
      : input.scope === strategyScope
        ? normalizeStrategyPayload(validatedPayload)
      : input.scope === videoDetailScope
        ? videoDetailPayloadSchema.parse(
            normalizeVideoDetailPayload(
              videoDetailAiPayloadSchema.parse(validatedPayload),
            ),
          )
      : validatedPayload;

  await persistArtifact({
    userId: input.userId,
    scope: input.scope,
    scopeRefId,
    sourceHash,
    rawInput,
    payload,
    rawOutput: result.outputText,
  });

  const stored = await getStoredArtifact(input.userId, input.scope, scopeRefId);
  if (!stored) {
    throw new Error("Failed to load stored insight artifact");
  }

  return await formatArtifact(stored);
};

export const refreshYoutubeInsightsForUser = async (input: {
  userId: string;
  forceRefresh?: boolean;
}) => {
  const dashboardState = await getAggregateAnalysisState(
    input.userId,
    dashboardScope,
  );

  if (dashboardState.currentCommentCount === 0) {
    return [];
  }

  return Promise.all([
    generateInsightForScope({
      userId: input.userId,
      scope: dashboardScope,
      forceRefresh: input.forceRefresh,
    }),
    generateInsightForScope({
      userId: input.userId,
      scope: commentsScope,
      forceRefresh: input.forceRefresh,
    }),
    generateInsightForScope({
      userId: input.userId,
      scope: strategyScope,
      forceRefresh: input.forceRefresh,
    }),
  ]);
};

export const getStoredAggregateInsightState = async (input: {
  userId: string;
  scope: AggregateInsightScope;
}) => {
  const state = await getAggregateAnalysisState(input.userId, input.scope);

  if (state.currentCommentCount === 0) {
    return {
      artifact: null,
      hasAnalysis: false,
      currentCommentCount: 0,
      regenerationThreshold: state.regenerationThreshold,
    };
  }

  if (!state.existing?.payloadJson) {
    return {
      artifact: await generateInsightForScope({
        userId: input.userId,
        scope: input.scope,
      }),
      hasAnalysis: true,
      currentCommentCount: state.currentCommentCount,
      regenerationThreshold: state.regenerationThreshold,
    };
  }

  return {
    artifact: state.existing ? await formatArtifact(state.existing) : null,
    hasAnalysis: Boolean(state.existing?.payloadJson),
    currentCommentCount: state.currentCommentCount,
    regenerationThreshold: state.regenerationThreshold,
  };
};

export const getStoredVideoInsightState = async (input: {
  userId: string;
  videoId: string;
}) => {
  const state = await getVideoAnalysisState(input.userId, input.videoId);

  if (state.currentCommentCount === 0) {
    return {
      artifact: null,
      hasAnalysis: false,
      currentCommentCount: 0,
      publicCommentCount: state.publicCommentCount,
      newCommentsSinceLastAnalysis: 0,
      regenerationThreshold: state.regenerationThreshold,
      canRegenerate: state.publicCommentCount !== 0,
    };
  }

  return {
    artifact: state.existing ? await formatArtifact(state.existing) : null,
    hasAnalysis: Boolean(state.existing?.payloadJson),
    currentCommentCount: state.currentCommentCount,
    publicCommentCount: state.publicCommentCount,
    newCommentsSinceLastAnalysis: state.newCommentsSinceLastAnalysis,
    regenerationThreshold: state.regenerationThreshold,
    canRegenerate: state.canRegenerate,
  };
};

export const generateVideoInsightOnDemand = async (input: {
  userId: string;
  videoId: string;
}) => {
  const dashboardAnalysisVideoIds = await getDashboardAnalysisVideoIds(
    input.userId,
  );
  if (dashboardAnalysisVideoIds.includes(input.videoId)) {
    throw new YoutubeRouteError(
      "Current dashboard is already showing this video's analysis",
      400,
    );
  }

  const channelLimits = await getChannelLimitsForUser(input.userId);
  await syncStoredVideoCommentsForAnalysis({
    userId: input.userId,
    videoId: input.videoId,
    commentsPerVideo: channelLimits.commentsPerVideo,
    cooldownMs: VIDEO_COMMENTS_SYNC_COOLDOWN_MS,
  });

  const state = await getVideoAnalysisState(input.userId, input.videoId);

  if (state.currentCommentCount === 0) {
    return {
      action: "skipped" as const,
      reason: "not_enough_comment_data" as const,
      artifact: null,
      currentCommentCount: 0,
      publicCommentCount: state.publicCommentCount,
      newCommentsSinceLastAnalysis: 0,
      regenerationThreshold: state.regenerationThreshold,
    };
  }

  if (state.existing && !state.canRegenerate) {
    return {
      action: "skipped" as const,
      reason: "not_enough_new_comments" as const,
      artifact: await formatArtifact(state.existing),
      currentCommentCount: state.currentCommentCount,
      publicCommentCount: state.publicCommentCount,
      newCommentsSinceLastAnalysis: state.newCommentsSinceLastAnalysis,
      regenerationThreshold: state.regenerationThreshold,
    };
  }

  const artifact = await generateInsightForScope({
    userId: input.userId,
    scope: videoDetailScope,
    scopeRefId: input.videoId,
    forceRefresh: true,
  });

  return {
    action: "generated" as const,
    reason: null,
    artifact,
    currentCommentCount: state.currentCommentCount,
    publicCommentCount: state.publicCommentCount,
    newCommentsSinceLastAnalysis: state.newCommentsSinceLastAnalysis,
    regenerationThreshold: state.regenerationThreshold,
  };
};

const formatArtifact = async (artifact: typeof insightArtifacts.$inferSelect) => {
  const payload = artifactPayloadSchema.parse({
    scope: artifact.scope,
    payload: artifact.payloadJson,
  });
  const resolvedPayload =
    payload.scope === dashboardScope
      ? dashboardPayloadSchema.parse({
          ...normalizeStoredDashboardPayload(payload.payload),
          overviewStats: await buildDeterministicDashboardOverviewStats(
            artifact.userId,
          ),
        })
      : payload.scope === strategyScope
        ? normalizeStrategyPayload(payload.payload)
      : payload.payload;

  return {
    id: artifact.id,
    platform: artifact.platform,
    scope: artifact.scope,
    scopeRefId: artifact.scopeRefId || null,
    sourceHash: artifact.sourceHash,
    model: artifact.model,
    promptVersion: artifact.promptVersion,
    status: artifact.status,
    payload: resolvedPayload,
    createdAt: artifact.createdAt,
    updatedAt: artifact.updatedAt,
  };
};
