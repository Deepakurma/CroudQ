import { z } from "zod";

import {
  commentsPayloadSchema,
  dashboardPayloadSchema,
  strategyPayloadSchema,
  videoDetailPayloadSchema,
} from "../../modules/insights/controller";

export const insightArtifactMetaSchema = z.object({
  id: z.string(),
  platform: z.string(),
  scope: z.string(),
  scopeRefId: z.string().nullable(),
  sourceHash: z.string(),
  model: z.string(),
  promptVersion: z.string(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const dashboardInsightResponseSchema = insightArtifactMetaSchema.extend({
  payload: dashboardPayloadSchema,
});

export const commentsInsightResponseSchema = insightArtifactMetaSchema.extend({
  payload: commentsPayloadSchema,
});

export const strategyInsightResponseSchema = insightArtifactMetaSchema.extend({
  payload: strategyPayloadSchema,
});

export const videoInsightParamsSchema = z.object({
  videoId: z.string().min(1),
});

export const videoInsightResponseSchema = insightArtifactMetaSchema.extend({
  payload: videoDetailPayloadSchema,
});

export const videoInsightStateResponseSchema = z.object({
  artifact: videoInsightResponseSchema.nullable(),
  hasAnalysis: z.boolean(),
  currentCommentCount: z.number().int().nonnegative(),
  newCommentsSinceLastAnalysis: z.number().int().nonnegative(),
  regenerationThreshold: z.number().int().positive(),
  canRegenerate: z.boolean(),
});

export const generateVideoInsightResponseSchema = z.object({
  action: z.enum(["generated", "skipped"]),
  reason: z.enum(["not_enough_new_comments"]).nullable(),
  artifact: videoInsightResponseSchema,
  currentCommentCount: z.number().int().nonnegative(),
  newCommentsSinceLastAnalysis: z.number().int().nonnegative(),
  regenerationThreshold: z.number().int().positive(),
});
