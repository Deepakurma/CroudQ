import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { properties, revokedTokens, superAdmins, users } from "../../db/schema";
import { authService } from "../../services/authService";
import { protectedProcedure, publicProcedure, router } from "../../server/trpc";
import { clearAllAuthCookies, setTenantAuthCookies, setVendorAuthCookies } from "../../utils/authCookies";
import { verifyJwt } from "../../utils/jwt";
import { retryOtpSchema, sendOtpSchema, setupSuperAdminSchema, verifyOtpSchema } from "./dto";

const hasVendorWebAccess = (identity: { roles: string[]; needsOnboarding: boolean }) =>
    identity.roles.includes("SUPER_ADMIN") ||
    identity.roles.includes("VENDOR") ||
    identity.needsOnboarding;

const hasTenantWebAccess = (identity: { roles: string[] }) =>
    identity.roles.includes("RESIDENT");

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

    verifyVendorWebOTP: publicProcedure
        .input(verifyOtpSchema)
        .mutation(async ({ input, ctx }) => {
            const result = await authService.verifyOTP(input.phoneNumber, input.otp, input.reqId);
            const isSuperAdmin = result.identity.roles.includes("SUPER_ADMIN");
            const isVendor = result.identity.roles.includes("VENDOR");
            const canAccessVendorWeb = hasVendorWebAccess(result.identity);

            if (!canAccessVendorWeb) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "This account is not eligible for vendor account access. Use tenant account access.",
                });
            }

            setVendorAuthCookies(ctx.res, result.token, isSuperAdmin ? "SUPER_ADMIN" : "VENDOR");

            if (isSuperAdmin) {
                return {
                    success: true,
                    identity: result.identity,
                    nextPath: "/admin/dashboard",
                };
            }

            const vendorProperty = await db.query.properties.findFirst({
                columns: { id: true },
                where: eq(properties.userId, result.identity.userId),
            });

            return {
                success: true,
                identity: result.identity,
                nextPath: vendorProperty ? "/vendor/property" : "/vendor/onboarding",
            };
        }),

    verifyTenantWebOTP: publicProcedure
        .input(verifyOtpSchema)
        .mutation(async ({ input, ctx }) => {
            const result = await authService.verifyOTP(input.phoneNumber, input.otp, input.reqId);
            const canAccessTenantWeb = hasTenantWebAccess(result.identity);

            if (!canAccessTenantWeb) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "This account is not eligible for tenant account access.",
                });
            }

            setTenantAuthCookies(ctx.res, result.token);

            return {
                success: true,
                identity: result.identity,
                nextPath: "/tenant/status",
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

    getVendorWebSession: protectedProcedure.query(async ({ ctx }) => {
        const identity = await authService.resolveIdentity(ctx.user.id);
        const isSuperAdmin = identity.roles.includes("SUPER_ADMIN");
        const canAccessVendorWeb = hasVendorWebAccess(identity);

        if (!canAccessVendorWeb) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Vendor session required.",
            });
        }

        if (isSuperAdmin) {
            return {
                identity,
                nextPath: "/admin/dashboard",
            };
        }

        const vendorProperty = await db.query.properties.findFirst({
            columns: { id: true },
            where: eq(properties.userId, ctx.user.id),
        });

        return {
            identity,
            nextPath: vendorProperty ? "/vendor/property" : "/vendor/onboarding",
        };
    }),

    getTenantWebSession: protectedProcedure.query(async ({ ctx }) => {
        const identity = await authService.resolveIdentity(ctx.user.id);
        const canAccessTenantWeb = hasTenantWebAccess(identity);

        if (!canAccessTenantWeb) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Tenant session required.",
            });
        }

        return {
            identity,
            nextPath: "/tenant/status",
        };
    }),

    // Temporary setup helper to create/replace the single super admin account.
    setupSuperAdmin: publicProcedure
        .input(setupSuperAdminSchema)
        .mutation(async ({ input }) => {
            const targetUser = await db.query.users.findFirst({
                where: eq(users.phoneNumber, input.phoneNumber),
            });

            if (!targetUser) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message:
                        "User not found for this phone. Login once with this phone first.",
                });
            }

            await db.transaction(async (tx) => {
                await tx.delete(superAdmins);
                await tx.insert(superAdmins).values({
                    id: crypto.randomUUID(),
                    userId: targetUser.id,
                    updatedAt: new Date(),
                });
            });

            return {
                success: true,
                userId: targetUser.id,
                phoneNumber: input.phoneNumber,
            };
        }),
});
