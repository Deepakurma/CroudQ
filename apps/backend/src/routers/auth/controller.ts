import {
  cancelAccountDeletion,
  loginWithEmail,
  requestAccountDeletion,
  requestPasswordReset,
  requestSignupOtp,
  resetPassword,
  updateProfileWithPassword,
  verifySignupOtp,
} from "../../modules/auth/controller";
import { enforceRateLimit } from "../../modules/rate-limit/controller";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../server/trpc";
import {
  loginInputSchema,
  requestPasswordResetInputSchema,
  resetPasswordInputSchema,
  signupInputSchema,
  updateProfileInputSchema,
  verifySignupOtpInputSchema,
} from "./dto";

export const authRouter = createTRPCRouter({
  signup: publicProcedure
    .input(signupInputSchema)
    .mutation(async ({ input }) => {
      await enforceRateLimit({
        scope: "auth.signup.request.email",
        identifier: input.email,
        maxAttempts: 5,
        windowMs: 60 * 60 * 1000,
        message: "Too many sign-up attempts. Please try again later.",
      });
      await enforceRateLimit({
        scope: "auth.signup.request.email.cooldown",
        identifier: input.email,
        maxAttempts: 1,
        windowMs: 30 * 1000,
        message: "Please wait before requesting another code.",
      });

      return await requestSignupOtp(input);
    }),

  verifySignupOtp: publicProcedure
    .input(verifySignupOtpInputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await verifySignupOtp(input);

      const token = await ctx.res.jwtSign({
        userId: result.user.id,
      });

      ctx.res.setCookie("token", token, {
        httpOnly: true,
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      await enforceRateLimit({
        scope: "auth.signup.verify.email",
        identifier: input.email,
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
        message: "Too many verification attempts. Please try again later.",
      });

      return result;
    }),

  login: publicProcedure
    .input(loginInputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await loginWithEmail(input);

      const token = await ctx.res.jwtSign({
        userId: result.userId,
      });

      ctx.res.setCookie("token", token, {
        httpOnly: true,
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      await enforceRateLimit({
        scope: "auth.login.email",
        identifier: input.email,
        maxAttempts: 8,
        windowMs: 15 * 60 * 1000,
        message: "Too many sign-in attempts. Please try again later.",
      });

      return result;
    }),

  getSession: publicProcedure.query(async ({ ctx }) => {
    console.log("getSession called");
    return ctx.user;
  }),

  requestAccountDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    return await requestAccountDeletion(ctx.user.userId);
  }),
  cancelAccountDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    return await cancelAccountDeletion(ctx.user.userId);
  }),
  updateProfile: protectedProcedure
    .input(updateProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      return await updateProfileWithPassword(ctx.user.userId, input);
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.res.clearCookie("token", {
      path: "/",
      httpOnly: true,
      secure: false,
    });

    return {
      success: true,
      message: "Logged out successfully",
    };
  }),

  requestPasswordReset: publicProcedure
    .input(requestPasswordResetInputSchema)
    .mutation(async ({ input }) => {
      await enforceRateLimit({
        scope: "auth.reset.email",
        identifier: input.email,
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000,
        message: "Too many reset requests. Please try again later.",
      });

      return await requestPasswordReset(input);
    }),

  resetPassword: publicProcedure
    .input(resetPasswordInputSchema)
    .mutation(async ({ input }) => {
      return await resetPassword(input);
    }),
});
