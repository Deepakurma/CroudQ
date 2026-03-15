import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "../../db";
import { notices } from "../../db/schema";
import { propertyProcedure, router } from "../../server/trpc";
import { createNoticeSchema, listNoticesSchema, noticeIdSchema } from "./dto";

export const noticeRouter = router({
    list: propertyProcedure
        .input(listNoticesSchema)
        .query(async ({ ctx, input }) => {
            // Lazy expiration: Mark notices as inactive if validUntil has passed
            await db.update(notices)
                .set({ isActive: false })
                .where(and(
                    eq(notices.propertyId, ctx.propertyId),
                    eq(notices.isActive, true),
                    isNotNull(notices.validUntil),
                    lt(notices.validUntil, new Date())
                ));

            return await db.select().from(notices)
                .where(eq(notices.propertyId, ctx.propertyId))
                .orderBy(desc(notices.createdAt))
                .limit(input?.limit ?? 150);
        }),
    create: propertyProcedure
        .input(createNoticeSchema)
        .mutation(async ({ input, ctx }) => {
            const id = crypto.randomUUID();
            const [created] = await db.insert(notices).values({
                id,
                propertyId: ctx.propertyId,
                title: input.title,
                description: input.description,
                validFrom: input.validFrom ? new Date(input.validFrom) : new Date(),
                validUntil: input.validUntil ? new Date(input.validUntil) : null,
            }).returning();

            return created;
        }),
    delete: propertyProcedure
        .input(noticeIdSchema)
        .mutation(async ({ input, ctx }) => {
            const deleted = await db.delete(notices)
                .where(and(eq(notices.id, input.id), eq(notices.propertyId, ctx.propertyId)))
                .returning({ id: notices.id });

            if (deleted.length === 0) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Notice not found" });
            }
            return { success: true };
        }),
});
