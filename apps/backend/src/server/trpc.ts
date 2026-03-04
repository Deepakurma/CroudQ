import { TRPCError, initTRPC } from "@trpc/server";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { superAdmins } from "../db/schema";
import { Context } from "./context";

const t = initTRPC.context<Context>().create({
    errorFormatter({ shape }) {
        if (shape.data.code === "INTERNAL_SERVER_ERROR") {
            return {
                ...shape,
                message: "Something went wrong. Please try again.",
            };
        }

        return shape;
    },
});

export const createTRPCRouter = t.router;
export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ next, ctx }) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
        });
    }
    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
        },
    });
});

export const protectedProcedure = t.procedure.use(isAuthed);

const enforcePropertyScope = t.middleware(async ({ ctx, next }) => {
    const propertyIdHeader = ctx.req.headers["x-property-id"];
    const propertyId =
        typeof propertyIdHeader === "string" ? propertyIdHeader : undefined;

    if (!propertyId) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Property context is missing.",
        });
    }

    if (!ctx.user) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to access property data.",
        });
    }

    const property = await db.query.properties.findFirst({
        where: (p, { and, eq }) =>
            and(eq(p.id, propertyId), eq(p.userId, ctx.user!.id)),
    });

    if (!property) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Property not found or access denied.",
        });
    }

    if (property.isFrozen) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: property.freezeReason || "This account has been frozen by admin. Contact support.",
        });
    }

    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
            propertyId: property.id,
        },
    });
});

export const propertyProcedure = t.procedure.use(isAuthed).use(enforcePropertyScope);

const isSuperAdmin = t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
        });
    }

    const adminAccount = await db.query.superAdmins.findFirst({
        where: eq(superAdmins.userId, ctx.user.id),
    });

    if (!adminAccount) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Super admin access required.",
        });
    }

    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
        },
    });
});

export const superAdminProcedure = t.procedure.use(isAuthed).use(isSuperAdmin);
