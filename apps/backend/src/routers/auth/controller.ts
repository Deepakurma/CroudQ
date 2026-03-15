import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { properties, revokedTokens, superAdmins, users } from "../../db/schema";
import { authService } from "../../services/authService";
import { protectedProcedure, publicProcedure, router } from "../../server/trpc";
import { clearAllAuthCookies, setResidentAuthCookies, setLandlordAuthCookies } from "../../utils/authCookies";
import { verifyJwt } from "../../utils/jwt";
import { retryOtpSchema, sendOtpSchema, setupSuperAdminSchema, verifyOtpSchema } from "./dto";

const hasLandlordWebAccess = (identity: { roles: string[]; needsOnboarding: boolean }) =>
    identity.roles.includes("SUPER_ADMIN") ||
    identity.roles.includes("LANDLORD") ||
    identity.needsOnboarding;

const hasResidentWebAccess = (identity: { roles: string[] }) =>
    identity.roles.includes("RESIDENT");

const MAX_SUPER_ADMINS = 5;

export const authRouter = router({
    sendOTP: publicProcedure
        .input(sendOtpSchema)
        .mutation(async ({ input }) => {
            return authService.sendOTP(input.phoneNumber);
        }),

    retryOTP: publicProcedure
        .input(retryOtpSchema)
        .mutation(async ({ input }) => {
            return authService.retryOTP({
                phoneNumber: input.phoneNumber,
                reqId: input.reqId,
                retryChannel: input.retryChannel,
            });
        }),

    verifyOTP: publicProcedure
        .input(verifyOtpSchema)
        .mutation(async ({ input }) => {
            return authService.verifyOTP(input.phoneNumber, input.otp, input.reqId);
        }),

    verifyLandlordWebOTP: publicProcedure
        .input(verifyOtpSchema)
        .mutation(async ({ input, ctx }) => {
            const result = await authService.verifyOTP(input.phoneNumber, input.otp, input.reqId);
            const isSuperAdmin = result.identity.roles.includes("SUPER_ADMIN");
            const canAccessLandlordWeb = hasLandlordWebAccess(result.identity);

            if (!canAccessLandlordWeb) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "This account is not eligible for landlord account access. Use resident account access.",
                });
            }

            setLandlordAuthCookies(ctx.res, result.token, isSuperAdmin ? "SUPER_ADMIN" : "LANDLORD");

            if (isSuperAdmin) {
                return {
                    success: true,
                    identity: result.identity,
                    nextPath: "/admin/dashboard",
                };
            }

            const landlordProperty = await db.query.properties.findFirst({
                columns: { id: true },
                where: eq(properties.userId, result.identity.userId),
            });

            return {
                success: true,
                identity: result.identity,
                nextPath: landlordProperty ? "/landlord/property" : "/landlord/onboarding",
            };
        }),

    verifyResidentWebOTP: publicProcedure
        .input(verifyOtpSchema)
        .mutation(async ({ input, ctx }) => {
            const result = await authService.verifyOTP(input.phoneNumber, input.otp, input.reqId);
            const canAccessResidentWeb = hasResidentWebAccess(result.identity);

            if (!canAccessResidentWeb) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "This account is not eligible for resident account access.",
                });
            }

            setResidentAuthCookies(ctx.res, result.token);

            return {
                success: true,
                identity: result.identity,
                nextPath: "/resident/status",
            };
        }),

    logout: publicProcedure.mutation(async ({ ctx }) => {
        // Always clear cookies, even when token is missing/expired/invalid.
        clearAllAuthCookies(ctx.res);

        const parsed = ctx.token ? verifyJwt(ctx.token) : null;
        if (parsed?.jti && parsed?.userId && parsed?.exp) {
            await db
                .insert(revokedTokens)
                .values({
                    jti: parsed.jti,
                    userId: parsed.userId,
                    expiresAt: new Date(parsed.exp * 1000),
                })
                .onConflictDoNothing();
        }

        return { success: true };
    }),

    getCurrentUser: protectedProcedure.query(({ ctx }) => {
        return ctx.user;
    }),

    getIdentity: protectedProcedure.query(async ({ ctx }) => {
        return authService.resolveIdentity(ctx.user.id);
    }),

    getLandlordWebSession: protectedProcedure.query(async ({ ctx }) => {
        const identity = await authService.resolveIdentity(ctx.user.id);
        const isSuperAdmin = identity.roles.includes("SUPER_ADMIN");
        const canAccessLandlordWeb = hasLandlordWebAccess(identity);

        if (!canAccessLandlordWeb) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Landlord session required.",
            });
        }

        if (isSuperAdmin) {
            return {
                identity,
                nextPath: "/admin/dashboard",
            };
        }

        const landlordProperty = await db.query.properties.findFirst({
            columns: { id: true },
            where: eq(properties.userId, ctx.user.id),
        });

        return {
            identity,
            nextPath: landlordProperty ? "/landlord/property" : "/landlord/onboarding",
        };
    }),

    getResidentWebSession: protectedProcedure.query(async ({ ctx }) => {
        const identity = await authService.resolveIdentity(ctx.user.id);
        const canAccessResidentWeb = hasResidentWebAccess(identity);

        if (!canAccessResidentWeb) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Resident session required.",
            });
        }

        return {
            identity,
            nextPath: "/resident/status",
        };
    }),

    // Temporary setup helper to create up to five super admin accounts.
    setupSuperAdmin: publicProcedure
        .input(setupSuperAdminSchema)
        .mutation(async ({ input }) => {
            const targetUser = await db.transaction(async (tx) => {
                const existingUser = await tx.query.users.findFirst({
                    where: eq(users.phoneNumber, input.phoneNumber),
                });

                if (existingUser) {
                    const existingSuperAdmin = await tx.query.superAdmins.findFirst({
                        where: eq(superAdmins.userId, existingUser.id),
                    });

                    if (existingSuperAdmin) {
                        return existingUser;
                    }
                }

                const currentSuperAdmins = await tx.query.superAdmins.findMany({
                    columns: { id: true },
                    limit: MAX_SUPER_ADMINS,
                });

                if (currentSuperAdmins.length >= MAX_SUPER_ADMINS) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: `You can only create up to ${MAX_SUPER_ADMINS} super admins.`,
                    });
                }

                const userToPromote = existingUser
                    ? existingUser
                    : (
                        await tx
                            .insert(users)
                            .values({
                                id: crypto.randomUUID(),
                                createdAt: new Date(),
                                phoneNumber: input.phoneNumber,
                            })
                            .returning()
                    )[0];

                await tx.insert(superAdmins).values({
                    id: crypto.randomUUID(),
                    userId: userToPromote.id,
                    updatedAt: new Date(),
                });

                return userToPromote;
            });

            return {
                success: true,
                userId: targetUser.id,
                phoneNumber: input.phoneNumber,
            };
        }),
});
