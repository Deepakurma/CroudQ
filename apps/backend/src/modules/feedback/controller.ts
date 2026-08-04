import { eq } from "drizzle-orm";

import { db } from "../../db";
import { feedback } from "../../db/schema";

export const submitFeedback = async ({
  userId,
  name,
  email,
  message,
}: {
  userId: string;
  name: string | null;
  email: string;
  message: string;
}) => {
  const now = new Date();
  const trimmedMessage = message.trim();

  await db.insert(feedback).values({
    userId,
    name: name?.trim() || null,
    email: email.trim().toLowerCase(),
    message: trimmedMessage,
    updatedAt: now,
  });

  return { message: "Feedback submitted successfully" };
};
