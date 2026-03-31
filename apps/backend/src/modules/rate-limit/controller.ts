import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { db } from "../../db";
import { authRateLimits } from "../../db/schema";

const normalizeIdentifier = (value: string) => value.trim().toLowerCase();

export const enforceRateLimit = async ({
  scope,
  identifier,
  maxAttempts,
  windowMs,
  message,
}: {
  scope: string;
  identifier: string;
  maxAttempts: number;
  windowMs: number;
  message: string;
}) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const id = `${scope}:${normalizedIdentifier}`;
  const now = new Date();
  const existing = await db.query.authRateLimits.findFirst({
    where: eq(authRateLimits.id, id),
  });

  if (!existing || existing.expiresAt <= now) {
    await db
      .insert(authRateLimits)
      .values({
        id,
        scope,
        identifier: normalizedIdentifier,
        attempts: 1,
        expiresAt: new Date(Date.now() + windowMs),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: authRateLimits.id,
        set: {
          attempts: 1,
          expiresAt: new Date(Date.now() + windowMs),
          updatedAt: now,
        },
      });
    return;
  }

  if (existing.attempts >= maxAttempts) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message,
    });
  }

  await db
    .update(authRateLimits)
    .set({
      attempts: existing.attempts + 1,
      updatedAt: now,
    })
    .where(eq(authRateLimits.id, id));
};
