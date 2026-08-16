import { z } from "zod";

export const InsightPayloadSchema = z.object({
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

