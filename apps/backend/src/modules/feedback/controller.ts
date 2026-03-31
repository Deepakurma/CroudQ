import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";

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

export const listFeedbackForAdmin = async ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) => {
  const [totalRow] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(feedback);

  const entries = await db.query.feedback.findMany({
    orderBy: desc(feedback.createdAt),
    limit,
    offset,
  });

  return {
    total: totalRow?.count ?? 0,
    items: entries.map((item) => ({
      id: item.id,
      userId: item.userId,
      name: item.name,
      email: item.email,
      message: item.message,
      createdAt: item.createdAt,
    })),
  };
};

export const deleteFeedbackByAdmin = async (id: string) => {
  const [deleted] = await db
    .delete(feedback)
    .where(eq(feedback.id, id))
    .returning({ id: feedback.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Feedback not found",
    });
  }

  return { message: "Feedback deleted" };
};
