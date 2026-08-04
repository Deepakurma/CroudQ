import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import type { FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { CorsConfig } from "../config/cors-config";
import { appRouter } from "../routers";
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

  server.get("/", async () => {
    return { message: "Hello, Developer 😁!" };
  });

  server.get("/health", async () => {
    return { message: "I'm Healthy!" };
  });

  await registerYoutubeCallbackRoute(server);

  await server.register(cookie, {
    secret: process.env.COOKIE_SECRET!,
    hook: "onRequest",
  });

  server.register(jwt, {
    secret: process.env.JWT_SECRET!,
    cookie: {
      cookieName: "token",
      signed: false,
    },
    sign: {
      expiresIn: "7d",
    },
  });

  server.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err: unknown) {
        if (err instanceof Error) {
          request.log.warn(
            { err },
            "JWT verification failed (preHandler hook)",
          );
        } else {
          request.log.warn({ err }, "Unknown JWT verification error");
        }
        if (request.cookies.token) {
          reply.clearCookie("token", { path: "/" });
        }
      }
    },
  );

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
