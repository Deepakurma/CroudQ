import { isNotNull, lt, or } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { db } from "../db";
import {
  authRateLimits,
  passwordResetTokens,
  signupEmailOtps,
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

    const deletedAuthRateLimits = await db
      .delete(authRateLimits)
      .where(lt(authRateLimits.expiresAt, now))
      .returning({ id: authRateLimits.id });

    const deletedPasswordResetTokens = await db
      .delete(passwordResetTokens)
      .where(
        or(
          lt(passwordResetTokens.expiresAt, now),
          isNotNull(passwordResetTokens.usedAt),
        ),
      )
      .returning({ id: passwordResetTokens.id });
    const deletedSignupEmailOtps = await db
      .delete(signupEmailOtps)
      .where(
        or(
          lt(signupEmailOtps.expiresAt, now),
          isNotNull(signupEmailOtps.usedAt),
        ),
      )
      .returning({ id: signupEmailOtps.id });
    if (deletedAuthRateLimits.length > 0) {
      server.log.info(
        { deletedCount: deletedAuthRateLimits.length },
        "Expired auth rate limits cleaned up",
      );
    }

    if (deletedPasswordResetTokens.length > 0) {
      server.log.info(
        { deletedCount: deletedPasswordResetTokens.length },
        "Expired or used password reset tokens cleaned up",
      );
    }

    if (deletedSignupEmailOtps.length > 0) {
      server.log.info(
        { deletedCount: deletedSignupEmailOtps.length },
        "Expired or used signup email OTPs cleaned up",
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
