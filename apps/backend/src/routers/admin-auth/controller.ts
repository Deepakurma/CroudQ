import {
  assertUserIsAdmin,
  createAdminByAdmin,
  getCurrentAdminUser,
  loginAdminWithEmail,
  logoutSession,
  requestAdminPasswordReset,
  refreshAdminAuthSession,
  resetAdminPassword,
} from "../../modules/auth/controller";
import { enforceRateLimit } from "../../modules/rate-limit/controller";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../server/trpc";
import { authMessageSchema, authUserSchema } from "../auth/dto";
import {
  adminLoginInputSchema,
  createAdminInputSchema,
  requestAdminPasswordResetInputSchema,
  resetAdminPasswordInputSchema,
} from "./dto";
import { TRPCError } from "@trpc/server";

const getRequestIp = (req: { ip?: string }) => req.ip?.trim() || "unknown";
const getRequestCookies = (req: unknown) =>
  ((req as { cookies?: Record<string, string | undefined> }).cookies ?? {});
const ACCESS_TOKEN_COOKIE = "auth_token";
const REFRESH_TOKEN_COOKIE = "admin_refresh_token";
const DEFAULT_ACCESS_TOKEN_TTL = "15m";
const DEFAULT_REFRESH_TOKEN_TTL = "30d";

const getAdminCookieDomain = () =>
  process.env.WEB_COOKIE_DOMAIN?.trim() || undefined;

const parseDurationToSeconds = (value: string) => {
  const match = value.trim().match(/^(\d+)([mhd])$/i);
  if (!match) {
    throw new Error(`Unsupported duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitSeconds = unit === "m" ? 60 : unit === "h" ? 60 * 60 : 24 * 60 * 60;
  return amount * unitSeconds;
};

const getCookieOptions = () => ({
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  domain: getAdminCookieDomain(),
});

const setAdminAuthCookies = (
  reply: unknown,
  session: {
    accessToken: string;
    refreshToken: string;
  },
) => {
  const fastifyReply = reply as {
    setCookie?: (name: string, value: string, options: Record<string, unknown>) => void;
  };
  if (!fastifyReply.setCookie) return;

  const accessTokenMaxAge = parseDurationToSeconds(
    process.env.ACCESS_TOKEN_TTL?.trim() || DEFAULT_ACCESS_TOKEN_TTL,
  );
  const refreshTokenMaxAge = parseDurationToSeconds(
    process.env.REFRESH_TOKEN_TTL?.trim() || DEFAULT_REFRESH_TOKEN_TTL,
  );

  fastifyReply.setCookie(ACCESS_TOKEN_COOKIE, session.accessToken, {
    ...getCookieOptions(),
    maxAge: accessTokenMaxAge,
  });
  fastifyReply.setCookie(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...getCookieOptions(),
    maxAge: refreshTokenMaxAge,
  });
};

const clearAdminAuthCookies = (reply: unknown) => {
  const fastifyReply = reply as {
    clearCookie?: (name: string, options?: Record<string, unknown>) => void;
  };
  if (!fastifyReply.clearCookie) return;

  const cookieOptions = {
    path: "/",
    domain: getAdminCookieDomain(),
  };

  fastifyReply.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions);
  fastifyReply.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
};

export const adminAuthRouter = createTRPCRouter({
  login: publicProcedure.input(adminLoginInputSchema).mutation(async ({ ctx, input }) => {
    await enforceRateLimit({
      scope: "admin.auth.login.ip",
      identifier: getRequestIp(ctx.req),
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000,
      message: "Too many sign-in attempts. Please try again later.",
    });
    await enforceRateLimit({
      scope: "admin.auth.login.email",
      identifier: input.email,
      maxAttempts: 8,
      windowMs: 15 * 60 * 1000,
      message: "Too many sign-in attempts. Please try again later.",
    });

    const session = await loginAdminWithEmail(input, {
      ipAddress: getRequestIp(ctx.req),
      userAgent:
        typeof ctx.req.headers["user-agent"] === "string"
          ? ctx.req.headers["user-agent"]
          : null,
    });

    setAdminAuthCookies(ctx.res, session);
    return authUserSchema.parse(session.user);
  }),
  refreshSession: publicProcedure.mutation(async ({ ctx }) => {
    const refreshToken = getRequestCookies(ctx.req)[REFRESH_TOKEN_COOKIE]?.trim() || null;

    if (!refreshToken) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Refresh session is invalid or expired",
      });
    }

    const session = await refreshAdminAuthSession(
      { refreshToken },
      {
        ipAddress: getRequestIp(ctx.req),
        userAgent:
          typeof ctx.req.headers["user-agent"] === "string"
            ? ctx.req.headers["user-agent"]
            : null,
      },
    );

    setAdminAuthCookies(ctx.res, session);

    return authUserSchema.parse(session.user);
  }),
  me: protectedProcedure.query(async ({ ctx }) => {
    return authUserSchema.parse(await getCurrentAdminUser(ctx.user.id));
  }),
  createAdmin: protectedProcedure
    .input(createAdminInputSchema)
    .mutation(async ({ ctx, input }) => {
      await assertUserIsAdmin(ctx.user.id);

      await enforceRateLimit({
        scope: "admin.auth.create.ip",
        identifier: getRequestIp(ctx.req),
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000,
        message: "Too many admin creation attempts. Please try again later.",
      });

      return authUserSchema.parse(await createAdminByAdmin(ctx.user.id, input));
    }),
  requestPasswordReset: publicProcedure
    .input(requestAdminPasswordResetInputSchema)
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit({
        scope: "admin.auth.reset.ip",
        identifier: getRequestIp(ctx.req),
        maxAttempts: 5,
        windowMs: 60 * 60 * 1000,
        message: "Too many reset requests. Please try again later.",
      });
      await enforceRateLimit({
        scope: "admin.auth.reset.email",
        identifier: input.email,
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000,
        message: "Too many reset requests. Please try again later.",
      });

      return authMessageSchema.parse(await requestAdminPasswordReset(input));
    }),
  resetPassword: publicProcedure
    .input(resetAdminPasswordInputSchema)
    .mutation(async ({ input }) => {
      return authMessageSchema.parse(await resetAdminPassword(input));
    }),
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const refreshToken = getRequestCookies(ctx.req)[REFRESH_TOKEN_COOKIE]?.trim() || null;

    const result = await logoutSession({
      accessToken: ctx.token,
      refreshToken,
    });

    clearAdminAuthCookies(ctx.res);
    return authMessageSchema.parse(result);
  }),
});
