import { z } from "zod";

export const submitFeedbackInputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(3, "Feedback must be at least 3 characters")
    .max(2000, "Feedback must be 2000 characters or less"),
});

export const feedbackMessageSchema = z.object({
  message: z.string(),
});
