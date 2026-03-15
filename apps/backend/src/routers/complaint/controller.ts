import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { complaints, residents, rooms } from "../../db/schema";
import { propertyProcedure, router } from "../../server/trpc";
import { complaintIdSchema, createComplaintSchema, listComplaintsSchema } from "./dto";

export const complaintRouter = router({
    list: propertyProcedure
        .input(listComplaintsSchema)
        .query(async ({ input, ctx }) => {
            const filters = [eq(complaints.propertyId, ctx.propertyId)];
            const searchQuery = input?.q?.trim();

            if (input?.status) {
                filters.push(eq(complaints.status, input.status));
            }

            if (searchQuery) {
                filters.push(
                    sql`(
                        setweight(to_tsvector('english', coalesce(${complaints.title}, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(${complaints.description}, '')), 'B')
                    ) @@ websearch_to_tsquery('english', ${searchQuery})`,
                );
            }
            const result = await db
                .select({
                    complaint: complaints,
                    roomNumber: rooms.roomNumber,
                    floorNumber: rooms.floorNumber,
                })
                .from(complaints)
                .leftJoin(
                    rooms,
                    and(eq(complaints.roomId, rooms.id), eq(rooms.propertyId, ctx.propertyId)),
                )
                .where(and(...filters))
                .orderBy(desc(complaints.createdAt))
                .limit(input?.limit ?? 150);

            return result.map((row) => ({
                ...row.complaint,
                roomNumber: row.roomNumber,
                floorNumber: row.floorNumber,
            }));
        }),
    create: propertyProcedure
        .input(createComplaintSchema)
        .mutation(async ({ input, ctx }) => {
            // Validate residentId belongs to this property if provided
            if (input.residentId) {
                const resident = await db.query.residents.findFirst({
                    where: and(
                        eq(residents.id, input.residentId),
                        eq(residents.propertyId, ctx.propertyId)
                    )
                });
                if (!resident) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Resident not found in this property"
                    });
                }
            }

            // Validate roomId belongs to this property if provided
            if (input.roomId) {
                const room = await db.query.rooms.findFirst({
                    where: and(
                        eq(rooms.id, input.roomId),
                        eq(rooms.propertyId, ctx.propertyId)
                    )
                });
                if (!room) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Room not found in this property"
                    });
                }
            }

            const id = crypto.randomUUID();
            const [created] = await db.insert(complaints).values({
                id,
                propertyId: ctx.propertyId,
                ...input,
            }).returning();

            return created;
        }),
    resolve: propertyProcedure
        .input(complaintIdSchema)
        .mutation(async ({ input, ctx }) => {
            const [updated] = await db.update(complaints)
                .set({ status: 'resolved', resolvedAt: new Date() })
                .where(and(eq(complaints.id, input.id), eq(complaints.propertyId, ctx.propertyId)))
                .returning();

            if (!updated) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Complaint not found" });
            }

            return updated;
        }),
    delete: propertyProcedure
        .input(complaintIdSchema)
        .mutation(async ({ input, ctx }) => {
            const deleted = await db.delete(complaints)
                .where(and(eq(complaints.id, input.id), eq(complaints.propertyId, ctx.propertyId)))
                .returning({ id: complaints.id });

            if (deleted.length === 0) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Complaint not found" });
            }

            return { success: true };
        }),
});
