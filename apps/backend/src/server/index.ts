import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { CorsConfig, isAllowedOrigin } from "../config/cors-config";
import { appRouter } from "../routers";
import { registerWebClaimRoute } from "../routers/auth/web-claim-route";
import { registerRazorpayWebhookRoute } from "../routers/billing/razorpay-webhook-route";
import { registerYoutubeCallbackRoute } from "../routers/youtube/controller";
import { createContext } from "./context";
import { registerRevokedTokenCleanup } from "./revoked-token-cleanup";
import type { AppRouter } from "../routers";

export type ServerOptions = {
  port?: number;
  host?: string;
};

export async function createServer(
  server: FastifyInstance,
  opts: ServerOptions = {},
) {
  server.register(rateLimit, {
    max: 250,
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

  await registerYoutubeCallbackRoute(server);
  await registerWebClaimRoute(server);
  await registerRazorpayWebhookRoute(server);

  server.addHook("onRequest", async (req: FastifyRequest, reply: FastifyReply) => {
    const isMutationMethod =
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "PATCH" ||
      req.method === "DELETE";
    if (!isMutationMethod || !req.url.startsWith("/trpc")) {
      return;
    }

    const hasAuthCookie = Boolean(req.cookies?.auth_token);
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
    } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
  });

  const { startRevokedTokenCleanup } = registerRevokedTokenCleanup(server);

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
