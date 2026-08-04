import { z } from "zod";

import { VideoPayloadSchema } from "../../modules/insights/controller";

export const insightResponseSchema = z.object({
  id: z.string(),
  sourceHash: z.string(),
  model: z.string(),
  promptVersion: z.string(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  payload: VideoPayloadSchema,
});

export const insightStateResponseSchema = z.object({
  artifact: insightResponseSchema.nullable(),
  hasYoutubeAccount: z.boolean(),
  channelName: z.string().optional(),
  viewsCount: z.number().optional(),
  likesCount: z.number().optional(),
  hasAnalysis: z.boolean(),
  videoTitle: z.string().optional(),
  currentCommentCount: z.number().int().nonnegative(),
  regenerationThreshold: z.number().int().nonnegative(),
  canRegenerate: z.boolean(),
});

export const refreshInsightResponseSchema = z.array(insightResponseSchema);
