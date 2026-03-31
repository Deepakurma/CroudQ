import { z } from "zod";

export const adminFeedbackItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().nullable(),
  email: z.string().email(),
  message: z.string(),
  createdAt: z.date(),
});

export const adminFeedbackListInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const adminFeedbackListSchema = z.object({
  total: z.number().int().nonnegative(),
  items: z.array(adminFeedbackItemSchema),
});

export const deleteAdminFeedbackInputSchema = z.object({
  id: z.string().min(1),
});

export const adminFeedbackMessageSchema = z.object({
  message: z.string(),
});
