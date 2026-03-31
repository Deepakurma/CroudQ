import { inferAsyncReturnType } from "@trpc/server";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "../db";
import { authSessions, users } from "../db/schema";
import { verifyJwt } from "../utils/jwt";

type CookieBag = Record<string, string | undefined>;

const getTokenFromCookieHeader = (cookieHeader?: string) => {
  if (!cookieHeader) return null;

  const cookieParts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of cookieParts) {
    if (!part.startsWith("auth_token=")) continue;
    const token = part.slice("auth_token=".length);
    return decodeURIComponent(token);
  }

  return null;
};

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const authHeader = req.headers.authorization;
  const parsedCookies = (req as { cookies?: CookieBag }).cookies;
  const cookieToken =
    parsedCookies?.auth_token?.trim() || getTokenFromCookieHeader(req.headers.cookie);

  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
  const token = bearerToken || cookieToken;
  let user = null;

  if (token) {
    const payload = verifyJwt(token);

    if (payload && payload.userId) {
      const revoked = await db.query.revokedTokens.findFirst({
        where: (r, { and, eq, gt }) =>
          and(eq(r.jti, payload.jti), gt(r.expiresAt, new Date())),
      });
      if (revoked) {
        return { req, res, user: null, token: null };
      }

      if (payload.sessionId) {
        const activeSession = await db.query.authSessions.findFirst({
          where: and(
            eq(authSessions.id, payload.sessionId),
            isNull(authSessions.revokedAt),
            gt(authSessions.expiresAt, new Date()),
          ),
        });

        if (!activeSession) {
          return { req, res, user: null, token: null };
        }
      }

      const foundUser = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
      });
      if (foundUser) {
        user = foundUser;
      }
    }
  }

  return { req, res, user, token };
}

export type Context = inferAsyncReturnType<typeof createContext>;
