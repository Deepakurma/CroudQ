import { createHash, randomBytes } from "crypto";

import { and, eq, gt, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { db } from "../../db";
import { oauthStates } from "../../db/schema";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export const createOAuthState = async ({
  provider,
  userId,
  redirectTo,
}: {
  provider: string;
  userId: string;
  redirectTo?: string | null;
}) => {
  const rawToken = randomBytes(32).toString("hex");

  await db.insert(oauthStates).values({
    provider,
    tokenHash: createHash("sha256").update(rawToken).digest("hex"),
    userId,
    redirectTo: redirectTo?.trim() || null,
    expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
  });

  return rawToken;
};

export const consumeOAuthState = async ({
  provider,
  token,
}: {
  provider: string;
  token: string;
}) => {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const state = await db.query.oauthStates.findFirst({
    where: and(
      eq(oauthStates.provider, provider),
      eq(oauthStates.tokenHash, tokenHash),
      isNull(oauthStates.usedAt),
      gt(oauthStates.expiresAt, now),
    ),
  });

  if (!state) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Could not complete YouTube connection",
    });
  }

  await db
    .update(oauthStates)
    .set({
      usedAt: now,
    })
    .where(eq(oauthStates.id, state.id));

  return {
    userId: state.userId,
    redirectTo: state.redirectTo,
  };
};
