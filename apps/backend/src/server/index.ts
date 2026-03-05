import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { FastifyInstance } from "fastify";
import { lt } from "drizzle-orm";

import { CorsConfig, isAllowedOrigin } from "../config/cors-config";
import { db } from "../db";
import { revokedTokens } from "../db/schema";
import { appRouter } from "../routers";
import { createContext } from "./context";

export type ServerOptions = {
  port?: number;
  host?: string;
};

const getCleanupIntervalMs = () => {
  const rawMinutes = Number(
    process.env.REVOKED_TOKEN_CLEANUP_INTERVAL_MINUTES ?? "60",
  );
  if (!Number.isFinite(rawMinutes) || rawMinutes < 1) {
    return 60 * 60 * 1000;
  }
  return Math.floor(rawMinutes * 60 * 1000);
};

export async function createServer(
  server: FastifyInstance,
  opts: ServerOptions = {},
) {
  server.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  server.register(cors, CorsConfig);
  server.register(cookie);

  server.get("/", async () => {
    return { message: "Hello, Developer 😁!" };
  });

  server.get("/health", async () => {
    return { message: "I'm Healthy!" };
  });

  server.addHook("onRequest", async (req, reply) => {
    const isMutationMethod =
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "PATCH" ||
      req.method === "DELETE";
    if (!isMutationMethod || !req.url.startsWith("/trpc")) {
      return;
    }

    const hasAuthCookie = Boolean(
      req.cookies?.bunkezy_landlord_token || req.cookies?.bunkezy_resident_token,
    );
    const hasBearerToken =
      req.headers.authorization?.startsWith("Bearer ") ?? false;
    if (!hasAuthCookie || hasBearerToken) {
      return;
    }

    const origin = req.headers.origin || "";
    const referer = req.headers.referer || "";
    let refererOrigin = "";
    if (referer) {
      try {
        refererOrigin = new URL(referer).origin;
      } catch {
        refererOrigin = "";
      }
    }
    const requestOrigin = origin || refererOrigin;

    if (!requestOrigin || !isAllowedOrigin(requestOrigin)) {
      return reply.code(403).send({ message: "Invalid request origin." });
    }
  });

  server.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: {
      router: appRouter,
      createContext,
      onError({ path, error }: { path: string | undefined; error: Error }) {
        const trpcCode = (error as { code?: string }).code;
        server.log.error(
          {
            path,
            code: trpcCode ?? "UNKNOWN",
            name: error.name,
            message: error.message,
          },
          "tRPC handler error",
        );
      },
    },
  });

  let revokedTokenCleanupTimer: ReturnType<typeof setInterval> | null = null;

  const runRevokedTokenCleanup = async () => {
    const deleted = await db
      .delete(revokedTokens)
      .where(lt(revokedTokens.expiresAt, new Date()))
      .returning({ jti: revokedTokens.jti });

    if (deleted.length > 0) {
      server.log.info(
        { deletedCount: deleted.length },
        "Expired revoked tokens cleaned up",
      );
    }
  };

  const startRevokedTokenCleanup = () => {
    const intervalMs = getCleanupIntervalMs();

    runRevokedTokenCleanup().catch((error) => {
      server.log.error({ error }, "Failed initial revoked token cleanup");
    });

    revokedTokenCleanupTimer = setInterval(() => {
      runRevokedTokenCleanup().catch((error) => {
        server.log.error({ error }, "Failed scheduled revoked token cleanup");
      });
    }, intervalMs);

    server.log.info({ intervalMs }, "Started revoked token cleanup scheduler");
  };

  server.addHook("onClose", async () => {
    if (revokedTokenCleanupTimer) {
      clearInterval(revokedTokenCleanupTimer);
      revokedTokenCleanupTimer = null;
    }
  });

  const start = async () => {
    try {
      startRevokedTokenCleanup();
      const port = opts.port ?? Number(process.env.PORT || "4000");
      const host = opts.host ?? "0.0.0.0";
      await server.listen({ port, host });
      console.log(`Server listening on http://localhost:${port}`);
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };

  const stop = async () => {
    await server.close();
  };

  return { server, start, stop };
}
