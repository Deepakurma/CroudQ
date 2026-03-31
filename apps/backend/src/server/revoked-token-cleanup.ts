import { and, isNotNull, lt, lte, or } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { db } from "../db";
import {
  authRateLimits,
  authSessions,
  passwordResetTokens,
  revokedTokens,
  users,
  webLoginTokens,
} from "../db/schema";

const getCleanupIntervalMs = () => {
  const rawMinutes = Number(
    process.env.REVOKED_TOKEN_CLEANUP_INTERVAL_MINUTES ?? "60",
  );
  if (!Number.isFinite(rawMinutes) || rawMinutes < 1) {
    return 60 * 60 * 1000;
  }
  return Math.floor(rawMinutes * 60 * 1000);
};

export const registerRevokedTokenCleanup = (server: FastifyInstance) => {
  let revokedTokenCleanupTimer: ReturnType<typeof setInterval> | null = null;

  const runSecurityCleanup = async () => {
    const now = new Date();
    const deletedRevokedTokens = await db
      .delete(revokedTokens)
      .where(lt(revokedTokens.expiresAt, now))
      .returning({ jti: revokedTokens.jti });
    const deletedAuthRateLimits = await db
      .delete(authRateLimits)
      .where(lt(authRateLimits.expiresAt, now))
      .returning({ id: authRateLimits.id });
    const deletedAuthSessions = await db
      .delete(authSessions)
      .where(lt(authSessions.expiresAt, now))
      .returning({ id: authSessions.id });
    const deletedPasswordResetTokens = await db
      .delete(passwordResetTokens)
      .where(
        or(
          lt(passwordResetTokens.expiresAt, now),
          isNotNull(passwordResetTokens.usedAt),
        ),
      )
      .returning({ id: passwordResetTokens.id });
    const deletedUsers = await db
      .delete(users)
      .where(
        and(
          isNotNull(users.scheduledDeletionAt),
          lte(users.scheduledDeletionAt, now),
        ),
      )
      .returning({ id: users.id });
    const deletedWebLoginTokens = await db
      .delete(webLoginTokens)
      .where(
        or(
          lt(webLoginTokens.expiresAt, now),
          isNotNull(webLoginTokens.usedAt),
        ),
      )
      .returning({ id: webLoginTokens.id });

    if (deletedRevokedTokens.length > 0) {
      server.log.info(
        { deletedCount: deletedRevokedTokens.length },
        "Expired revoked tokens cleaned up",
      );
    }

    if (deletedAuthRateLimits.length > 0) {
      server.log.info(
        { deletedCount: deletedAuthRateLimits.length },
        "Expired auth rate limits cleaned up",
      );
    }

    if (deletedAuthSessions.length > 0) {
      server.log.info(
        { deletedCount: deletedAuthSessions.length },
        "Expired auth sessions cleaned up",
      );
    }

    if (deletedPasswordResetTokens.length > 0) {
      server.log.info(
        { deletedCount: deletedPasswordResetTokens.length },
        "Expired or used password reset tokens cleaned up",
      );
    }

    if (deletedUsers.length > 0) {
      server.log.info(
        { deletedCount: deletedUsers.length },
        "Scheduled account deletions processed",
      );
    }

    if (deletedWebLoginTokens.length > 0) {
      server.log.info(
        { deletedCount: deletedWebLoginTokens.length },
        "Expired or used web login tokens cleaned up",
      );
    }
  };

  const startRevokedTokenCleanup = () => {
    const intervalMs = getCleanupIntervalMs();

    runSecurityCleanup().catch((error) => {
      server.log.error({ error }, "Failed initial security cleanup");
    });

    revokedTokenCleanupTimer = setInterval(() => {
      runSecurityCleanup().catch((error) => {
        server.log.error({ error }, "Failed scheduled security cleanup");
      });
    }, intervalMs);

    server.log.info({ intervalMs }, "Started security cleanup scheduler");
  };

  server.addHook("onClose", async () => {
    if (revokedTokenCleanupTimer) {
      clearInterval(revokedTokenCleanupTimer);
      revokedTokenCleanupTimer = null;
    }
  });

  return {
    startRevokedTokenCleanup,
  };
};
