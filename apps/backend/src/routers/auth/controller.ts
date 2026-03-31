import { TRPCError } from "@trpc/server";

import {
  cancelAccountDeletion,
  createUpgradeLink,
  getCurrentAuthUser,
  loginWithEmail,
  logoutSession,
  requestAccountDeletion,
  requestPasswordReset,
  resetPassword,
  signupWithEmail,
  updateProfileWithPassword,
} from "../../modules/auth/controller";
import { enforceRateLimit } from "../../modules/rate-limit/controller";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../server/trpc";
import {
  authMessageSchema,
  authUpgradeLinkSchema,
  authSessionSchema,
  authUserSchema,
  loginInputSchema,
  logoutInputSchema,
  refreshSessionInputSchema,
  requestPasswordResetInputSchema,
  resetPasswordInputSchema,
  signupInputSchema,
  updateProfileInputSchema,
} from "./dto";
import { refreshAuthSession } from "../../modules/auth/controller";
import {
  clearWebAuthCookies,
  getWebRefreshTokenFromCookies,
  setWebAuthCookies,
} from "../../modules/web-auth/controller";

const getRequestIp = (req: { ip?: string }) => req.ip?.trim() || "unknown";

export const authRouter = createTRPCRouter({
  signup: publicProcedure.input(signupInputSchema).mutation(async ({ ctx, input }) => {
    await enforceRateLimit({
      scope: "auth.signup.ip",
      identifier: getRequestIp(ctx.req),
      maxAttempts: 5,
      windowMs: 60 * 60 * 1000,
      message: "Too many sign-up attempts. Please try again later.",
    });
    await enforceRateLimit({
      scope: "auth.signup.email",
      identifier: input.email,
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000,
      message: "Too many sign-up attempts. Please try again later.",
    });

    return authSessionSchema.parse(
      await signupWithEmail(input, {
        ipAddress: getRequestIp(ctx.req),
        userAgent:
          typeof ctx.req.headers["user-agent"] === "string"
            ? ctx.req.headers["user-agent"]
            : null,
      }),
    );
  }),
  login: publicProcedure.input(loginInputSchema).mutation(async ({ ctx, input }) => {
    await enforceRateLimit({
      scope: "auth.login.ip",
      identifier: getRequestIp(ctx.req),
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000,
      message: "Too many sign-in attempts. Please try again later.",
    });
    await enforceRateLimit({
      scope: "auth.login.email",
      identifier: input.email,
      maxAttempts: 8,
      windowMs: 15 * 60 * 1000,
      message: "Too many sign-in attempts. Please try again later.",
    });

    return authSessionSchema.parse(
      await loginWithEmail(input, {
        ipAddress: getRequestIp(ctx.req),
        userAgent:
          typeof ctx.req.headers["user-agent"] === "string"
            ? ctx.req.headers["user-agent"]
            : null,
      }),
    );
  }),
  me: protectedProcedure.query(async ({ ctx }) => {
    return authUserSchema.parse(await getCurrentAuthUser(ctx.user.id));
  }),
  createUpgradeLink: protectedProcedure.mutation(async ({ ctx }) => {
    return authUpgradeLinkSchema.parse(
      await createUpgradeLink({
        userId: ctx.user.id,
        host:
          typeof ctx.req.headers.host === "string" ? ctx.req.headers.host : null,
        forwardedHost:
          typeof ctx.req.headers["x-forwarded-host"] === "string"
            ? ctx.req.headers["x-forwarded-host"]
            : null,
        forwardedProto:
          typeof ctx.req.headers["x-forwarded-proto"] === "string"
            ? ctx.req.headers["x-forwarded-proto"]
            : null,
      }),
    );
  }),
  requestAccountDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    return authUserSchema.parse(await requestAccountDeletion(ctx.user.id));
  }),
  cancelAccountDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    return authUserSchema.parse(await cancelAccountDeletion(ctx.user.id));
  }),
  updateProfile: protectedProcedure
    .input(updateProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      return authUserSchema.parse(
        await updateProfileWithPassword(ctx.user.id, input),
      );
    }),
  refreshSession: publicProcedure
    .input(refreshSessionInputSchema)
    .mutation(async ({ ctx, input }) => {
      return authSessionSchema.parse(
        await refreshAuthSession(input, {
          ipAddress: getRequestIp(ctx.req),
          userAgent:
            typeof ctx.req.headers["user-agent"] === "string"
              ? ctx.req.headers["user-agent"]
              : null,
        }),
      );
    }),
  refreshWebSession: publicProcedure.mutation(async ({ ctx }) => {
    const refreshToken = getWebRefreshTokenFromCookies(ctx.req);

    if (!refreshToken) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Refresh session is invalid or expired",
      });
    }

    const session = await refreshAuthSession(
      { refreshToken },
      {
        ipAddress: getRequestIp(ctx.req),
        userAgent:
          typeof ctx.req.headers["user-agent"] === "string"
            ? ctx.req.headers["user-agent"]
            : null,
      },
    );

    setWebAuthCookies(ctx.res, session);
    return authUserSchema.parse(session.user);
  }),
  logout: publicProcedure.input(logoutInputSchema.optional()).mutation(async ({ ctx, input }) => {
    return authMessageSchema.parse(
      await logoutSession({
        accessToken: ctx.token,
        refreshToken: input?.refreshToken ?? null,
      }),
    );
  }),
  logoutWeb: publicProcedure.mutation(async ({ ctx }) => {
    const refreshToken = getWebRefreshTokenFromCookies(ctx.req);

    const result = await logoutSession({
      accessToken: ctx.token,
      refreshToken,
    });

    clearWebAuthCookies(ctx.res);
    return authMessageSchema.parse(result);
  }),
  requestPasswordReset: publicProcedure
    .input(requestPasswordResetInputSchema)
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit({
        scope: "auth.reset.ip",
        identifier: getRequestIp(ctx.req),
        maxAttempts: 5,
        windowMs: 60 * 60 * 1000,
        message: "Too many reset requests. Please try again later.",
      });
      await enforceRateLimit({
        scope: "auth.reset.email",
        identifier: input.email,
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000,
        message: "Too many reset requests. Please try again later.",
      });

      return authMessageSchema.parse(await requestPasswordReset(input));
    }),
  resetPassword: publicProcedure
    .input(resetPasswordInputSchema)
    .mutation(async ({ input }) => {
      return authMessageSchema.parse(await resetPassword(input));
    }),
});
