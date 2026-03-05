import { TRPCError } from "@trpc/server";
import {
  addMonths,
  differenceInCalendarMonths,
  isBefore,
  startOfDay,
} from "date-fns";
import { and, desc, eq, gt, gte, isNotNull, lt, lte, or, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  checkouts,
  complaints,
  notices,
  propertyRoomTypes,
  residentJoinRequests,
  residentPayments,
  residents,
  rooms,
} from "../../db/schema";
import { residentIdentityService } from "../../services/residentIdentityService";
import { deleteS3Object, resolveManagedS3Key } from "../../services/s3-sender";
import { propertyProcedure, protectedProcedure, router } from "../../server/trpc";
import {
  approveRequestSchema,
  checkoutResidentSchema,
  createMyComplaintSchema,
  createResidentSchema,
  getResidentsByRoomSchema,
  listCheckoutsSchema,
  listMyComplaintsSchema,
  listPendingApprovalsSchema,
  listResidentsSchema,
  myComplaintIdSchema,
  paymentHistorySchema,
  rejectRequestSchema,
  residentIdSchema,
  roomIdSchema,
  updateResidentSchema,
} from "./dto";

type ResidentUpdateData = Partial<typeof residents.$inferInsert>;

// Helper: Calculate Next Rent Due Date based on Real-Time Rules
const calculateNextRentDueDate = (checkIn: Date, advanceMonths: number = 0) => {
  const today = startOfDay(new Date());
  const normalizedAdvanceMonths = Number(advanceMonths) || 0;
  const minMonthsFromCheckIn = Math.max(1, normalizedAdvanceMonths);
  const minimumAllowedDate = addMonths(checkIn, minMonthsFromCheckIn);
  let nextRentDueDate: Date;

  if (isBefore(today, minimumAllowedDate)) {
    nextRentDueDate = minimumAllowedDate;
  } else {
    const monthsDiff = differenceInCalendarMonths(today, minimumAllowedDate);

    const tentativeDate = addMonths(minimumAllowedDate, monthsDiff);

    if (isBefore(today, tentativeDate)) {
      nextRentDueDate = tentativeDate;
    } else {
      nextRentDueDate = addMonths(tentativeDate, 1);
    }
  }

  const isSameMonthYear =
    nextRentDueDate.getMonth() === today.getMonth() &&
    nextRentDueDate.getFullYear() === today.getFullYear();

  if (isSameMonthYear) {
    nextRentDueDate = addMonths(nextRentDueDate, 1);
  }

  return nextRentDueDate;
};

const findActiveResidentByUserId = async (
  userId: string | null | undefined,
) => {
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User identity is required for resident access.",
    });
  }

  return residentIdentityService.resolveResidentForAuthenticatedUser(userId);
};

const JOIN_INVITE_EXPIRY_HOURS = 24;
const FRONTEND_URL = (
  process.env.FRONTEND_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const generateInviteCode = () => {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
};

const parseDdMmYyyyDate = (value: string) => {
  const trimmed = value.trim();
  const parts = trimmed.split("/");
  if (parts.length !== 3) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid date format. Expected DD/MM/YYYY",
    });
  }
  const [day, month, year] = parts.map(Number);
  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year)
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid date format. Expected DD/MM/YYYY",
    });
  }
  const date = new Date(year, month - 1, day);
  if (
    isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid date format. Expected DD/MM/YYYY",
    });
  }
  return date;
};

export const residentRouter = router({
  create: propertyProcedure
    .input(createResidentSchema)
    .mutation(async ({ input, ctx }) => {
      // resolve room id if missing or verify it
      const targetRoomId = input.roomId;

      // Find room to confirm propertyId matches context
      const room = await db.query.rooms.findFirst({
        where: (r, { eq, and }) =>
          and(eq(r.id, targetRoomId), eq(r.propertyId, ctx.propertyId)),
        with: { property: true },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found or access denied",
        });
      }

      // Parse Date DD/MM/YYYY -> Date object
      const checkIn = parseDdMmYyyyDate(input.checkInDate);

      let checkOut: Date | null = null;
      if (input.durationMonths) {
        checkOut = new Date(checkIn);
        checkOut.setMonth(checkOut.getMonth() + input.durationMonths);
      }

      const nextRentDueDate = calculateNextRentDueDate(
        checkIn,
        input.advanceMonths || 0,
      );

      const created = await db.transaction(async (tx) => {
        const { userId, phoneNumber } =
          await residentIdentityService.ensureOnboardingAllowedAndResolveUser(
            tx,
            input.phoneNumber,
          );

        const [newResident] = await tx
          .insert(residents)
          .values({
            id: crypto.randomUUID(),
            propertyId: ctx.propertyId,
            roomId: room.id,
            userId,
            name: input.name,
            phoneNumber,
            active: true,
            profileImage: input.profileImage,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            rentAmount: input.rentAmount,
            advanceMonths: input.advanceMonths,
            status: "active",
            nextRentDueDate: nextRentDueDate,
            lastPaymentDate: null,
          })
          .returning();

        return newResident;
      });

      return {
        ...created,
        checkInDate: created.checkInDate.toISOString(),
        checkOutDate: created.checkOutDate?.toISOString(),
        nextRentDueDate: created.nextRentDueDate.toISOString(),
        lastPaymentDate: created.lastPaymentDate?.toISOString(),
      };
    }),

  createInvite: propertyProcedure
    .input(roomIdSchema)
    .mutation(async ({ input, ctx }) => {
      const room = await db.query.rooms.findFirst({
        where: (r, { and, eq }) =>
          and(eq(r.id, input.roomId), eq(r.propertyId, ctx.propertyId)),
        with: {
          type: true,
          property: true,
        },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found or access denied.",
        });
      }

      const activeOccupants = await db
        .select({ roomId: residents.roomId })
        .from(residents)
        .where(
          and(
            eq(residents.propertyId, ctx.propertyId),
            eq(residents.roomId, room.id),
            eq(residents.status, "active"),
          ),
        );

      const currentOccupancy = activeOccupants.length;
      const capacity = room.type?.maxOccupancy || 1;
      if (currentOccupancy >= capacity) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This room is already full. Please choose another room.",
        });
      }

      const inviteCode = generateInviteCode();
      const expiresAt = new Date(
        Date.now() + JOIN_INVITE_EXPIRY_HOURS * 60 * 60 * 1000,
      );
      const [createdInvite] = await db
        .insert(residentJoinRequests)
        .values({
          id: crypto.randomUUID(),
          propertyId: ctx.propertyId,
          roomId: room.id,
          createdBy: ctx.user.id,
          inviteCode,
          inviteExpiresAt: expiresAt,
          status: "invited",
        })
        .returning();

      const inviteUrl = `${FRONTEND_URL}/resident/join/${createdInvite.inviteCode}`;
      return {
        id: createdInvite.id,
        inviteCode: createdInvite.inviteCode,
        inviteUrl,
        inviteExpiresAt: createdInvite.inviteExpiresAt.toISOString(),
        room: {
          id: room.id,
          roomNumber: room.roomNumber,
          roomType: room.type?.name || "Unknown",
          isAc: room.ac || false,
          rentAmount: room.customRentAmount ?? room.type?.rentAmount ?? null,
        },
        propertyName: room.property.name,
      };
    }),

  listPendingApprovals: propertyProcedure
    .input(listPendingApprovalsSchema)
    .query(async ({ ctx, input }) => {
    const now = new Date();
    const limit = input?.limit ?? 100;

    await db
      .update(residentJoinRequests)
      .set({
        status: "expired",
        updatedAt: now,
      })
      .where(
        and(
          eq(residentJoinRequests.propertyId, ctx.propertyId),
          or(
            eq(residentJoinRequests.status, "invited"),
            eq(residentJoinRequests.status, "submitted"),
          )!,
          lt(residentJoinRequests.inviteExpiresAt, now),
        ),
      );

    const requests = await db.query.residentJoinRequests.findMany({
      where: and(
        eq(residentJoinRequests.propertyId, ctx.propertyId),
        eq(residentJoinRequests.status, "submitted"),
      ),
      orderBy: desc(residentJoinRequests.submittedAt),
      limit,
      with: {
        room: {
          with: {
            type: true,
          },
        },
      },
    });

      return requests.map((request) => ({
      id: request.id,
      inviteCode: request.inviteCode,
      status: request.status,
      submittedAt: request.submittedAt?.toISOString() ?? null,
      inviteExpiresAt: request.inviteExpiresAt.toISOString(),
      name: request.submittedName ?? "",
      phoneNumber: request.submittedPhoneNumber ?? "",
      profileImage: request.submittedProfileImage ?? null,
      checkInDate: request.submittedCheckInDate?.toISOString() ?? null,
      checkOutDate: request.submittedCheckOutDate?.toISOString() ?? null,
      durationMonths: request.submittedDurationMonths ?? null,
      rentAmount: request.submittedRentAmount ?? null,
      advanceMonths: request.submittedAdvanceMonths ?? 0,
      room: request.room
        ? {
            id: request.room.id,
            roomNumber: request.room.roomNumber,
            roomType: request.room.type?.name || "Unknown",
            isAc: request.room.ac || false,
            rentAmount:
              request.room.customRentAmount ??
              request.room.type?.rentAmount ??
              null,
          }
        : null,
      }));
    }),

  approveRequest: propertyProcedure
    .input(approveRequestSchema)
    .mutation(async ({ input, ctx }) => {
      return db.transaction(async (tx) => {
        const request = await tx.query.residentJoinRequests.findFirst({
          where: (r, { and, eq }) =>
            and(eq(r.id, input.requestId), eq(r.propertyId, ctx.propertyId)),
          with: {
            room: {
              with: {
                type: true,
              },
            },
          },
        });

        if (!request) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Approval request not found.",
          });
        }

        if (request.status !== "submitted") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only submitted requests can be approved.",
          });
        }

        if (request.inviteExpiresAt < new Date()) {
          await tx
            .update(residentJoinRequests)
            .set({
              status: "expired",
              updatedAt: new Date(),
            })
            .where(eq(residentJoinRequests.id, request.id));
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This request is expired and cannot be approved.",
          });
        }

        if (!request.room) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Linked room not found.",
          });
        }

        const finalRoomId = input.roomId || request.roomId;
        const finalRoom =
          finalRoomId === request.roomId
            ? request.room
            : await tx.query.rooms.findFirst({
                where: (r, { and, eq }) =>
                  and(eq(r.id, finalRoomId), eq(r.propertyId, ctx.propertyId)),
                with: { type: true },
              });

        if (!finalRoom) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Selected room not found in this property.",
          });
        }

        const currentOccupancyRows = await tx
          .select({ roomId: residents.roomId })
          .from(residents)
          .where(
            and(
              eq(residents.propertyId, ctx.propertyId),
              eq(residents.roomId, finalRoomId),
              eq(residents.status, "active"),
            ),
          );

        const currentOccupancy = currentOccupancyRows.length;
        const capacity = finalRoom.type?.maxOccupancy || 1;

        if (currentOccupancy >= capacity) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Room capacity reached. Please reject this request or free up space first.",
          });
        }

        if (
          !request.submittedName ||
          !request.submittedPhoneNumber ||
          !request.submittedCheckInDate
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Request details are incomplete and cannot be approved.",
          });
        }

        const finalCheckInDate = input.checkInDate
          ? parseDdMmYyyyDate(input.checkInDate)
          : request.submittedCheckInDate;
        const finalAdvanceMonths =
          input.advanceMonths !== undefined
            ? input.advanceMonths
            : request.submittedAdvanceMonths || 0;
        const finalDurationMonths =
          input.durationMonths !== undefined
            ? input.durationMonths
            : request.submittedDurationMonths || 0;
        const roomDefaultRent =
          finalRoom.customRentAmount ?? finalRoom.type?.rentAmount ?? null;
        const finalRentAmount =
          input.rentAmount ?? request.submittedRentAmount ?? roomDefaultRent;

        if (!finalRentAmount || finalRentAmount <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Rent amount is required before approval.",
          });
        }

        const finalCheckOutDate =
          finalDurationMonths > 0
            ? addMonths(finalCheckInDate, finalDurationMonths)
            : request.submittedCheckOutDate;

        const { userId, phoneNumber } =
          await residentIdentityService.ensureOnboardingAllowedAndResolveUser(
            tx,
            request.submittedPhoneNumber,
          );

        const nextRentDueDate = calculateNextRentDueDate(
          finalCheckInDate,
          finalAdvanceMonths,
        );

        const [newResident] = await tx
          .insert(residents)
          .values({
            id: crypto.randomUUID(),
            propertyId: ctx.propertyId,
            roomId: finalRoomId,
            userId,
            name: request.submittedName,
            phoneNumber,
            active: true,
            profileImage: request.submittedProfileImage || undefined,
            checkInDate: finalCheckInDate,
            checkOutDate: finalCheckOutDate,
            rentAmount: finalRentAmount,
            advanceMonths: finalAdvanceMonths,
            status: "active",
            nextRentDueDate,
            lastPaymentDate: null,
          })
          .returning();

        await tx
          .update(residentJoinRequests)
          .set({
            status: "approved",
            roomId: finalRoomId,
            submittedCheckInDate: finalCheckInDate,
            submittedCheckOutDate: finalCheckOutDate,
            submittedRentAmount: finalRentAmount,
            submittedAdvanceMonths: finalAdvanceMonths,
            submittedDurationMonths: finalDurationMonths || null,
            reviewedAt: new Date(),
            reviewedBy: ctx.user.id,
            updatedAt: new Date(),
          })
          .where(eq(residentJoinRequests.id, request.id));

        return {
          success: true,
          residentId: newResident.id,
        };
      });
    }),

  rejectRequest: propertyProcedure
    .input(rejectRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const request = await db.query.residentJoinRequests.findFirst({
        where: (r, { and, eq }) =>
          and(eq(r.id, input.requestId), eq(r.propertyId, ctx.propertyId)),
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Approval request not found.",
        });
      }

      if (request.status !== "submitted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only submitted requests can be rejected.",
        });
      }

      await db
        .update(residentJoinRequests)
        .set({
          status: "rejected",
          rejectionReason: input.reason || null,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(residentJoinRequests.id, request.id));

      return { success: true };
    }),

  markRentPaid: propertyProcedure
    .input(residentIdSchema)
    .mutation(async ({ input, ctx }) => {
      const resident = await db.query.residents.findFirst({
        where: (r, { eq, and }) =>
          and(eq(r.id, input.residentId), eq(r.propertyId, ctx.propertyId)),
      });

      if (!resident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resident not found or access denied",
        });
      }
      if (resident.rentAmount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Resident rent amount is invalid.",
        });
      }

      const paidAt = new Date();
      const paidForFromDueDate = resident.nextRentDueDate;
      const paidForToDueDate = addMonths(paidForFromDueDate, 1);

      const updated = await db.transaction(async (tx) => {
        const [nextResident] = await tx
          .update(residents)
          .set({
            lastPaymentDate: paidAt,
            lastPaidForDueDate: paidForToDueDate,
            nextRentDueDate: paidForToDueDate,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(residents.id, input.residentId),
              eq(residents.propertyId, ctx.propertyId),
              eq(residents.nextRentDueDate, paidForFromDueDate),
            ),
          )
          .returning();

        if (!nextResident) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Rent payment was already processed for this billing cycle. Please refresh and try again.",
          });
        }

        await tx.insert(residentPayments).values({
          id: crypto.randomUUID(),
          residentId: resident.id,
          propertyId: ctx.propertyId,
          amount: resident.rentAmount,
          paidAt,
          paidForFromDueDate,
          paidForToDueDate,
          createdAt: paidAt,
        });

        return nextResident;
      });

      return {
        ...updated,
        checkInDate: updated.checkInDate.toISOString(),
        checkOutDate: updated.checkOutDate?.toISOString(),
        nextRentDueDate: updated.nextRentDueDate.toISOString(),
        lastPaymentDate: updated.lastPaymentDate?.toISOString(),
      };
    }),

  getPaymentHistory: propertyProcedure
    .input(paymentHistorySchema)
    .query(async ({ input, ctx }) => {
      const resident = await db.query.residents.findFirst({
        where: (r, { and, eq }) =>
          and(eq(r.id, input.residentId), eq(r.propertyId, ctx.propertyId)),
      });

      if (!resident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resident not found or access denied",
        });
      }

      const rows = await db
        .select()
        .from(residentPayments)
        .where(
          and(
            eq(residentPayments.residentId, input.residentId),
            eq(residentPayments.propertyId, ctx.propertyId),
          ),
        )
        .orderBy(desc(residentPayments.paidAt))
        .limit(input.limit ?? 24);

      return rows.map((row) => ({
        id: row.id,
        amount: row.amount,
        paidAt: row.paidAt.toISOString(),
        paidForFromDueDate: row.paidForFromDueDate.toISOString(),
        paidForToDueDate: row.paidForToDueDate.toISOString(),
      }));
    }),

  getResidentsByRoom: propertyProcedure
    .input(getResidentsByRoomSchema)
    .query(async ({ input, ctx }) => {
      // Verify room belongs to property
      const room = await db.query.rooms.findFirst({
        where: (r, { eq, and }) =>
          and(eq(r.id, input.roomId), eq(r.propertyId, ctx.propertyId)),
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found or access denied",
        });
      }

      const result = await db
        .select()
        .from(residents)
        .where(
          and(
            eq(residents.roomId, input.roomId),
            eq(residents.propertyId, ctx.propertyId),
          ),
        )
        .orderBy(desc(residents.createdAt))
        .limit(input.limit ?? 100);

      return result.map((r) => ({
        ...r,
        checkInDate: r.checkInDate.toISOString(),
        nextRentDueDate: r.nextRentDueDate.toISOString(),
        lastPaymentDate: r.lastPaymentDate?.toISOString(),
      }));
    }),

  list: propertyProcedure
    .input(listResidentsSchema)
    .query(async ({ ctx, input }) => {
      const searchQuery = input?.q?.trim();
      const statusFilter = input?.status ?? "all";
      const limit = input?.limit ?? 100;
      const today = startOfDay(new Date());

      const filters = [eq(residents.propertyId, ctx.propertyId)];
      if (searchQuery) {
        filters.push(
          or(
            sql`(
              setweight(to_tsvector('english', coalesce(${residents.name}, '')), 'A') ||
              setweight(to_tsvector('english', coalesce(${residents.phoneNumber}, '')), 'B')
            ) @@ websearch_to_tsquery('english', ${searchQuery})`,
            sql`(
              setweight(to_tsvector('english', coalesce(${rooms.roomNumber}, '')), 'A')
            ) @@ websearch_to_tsquery('english', ${searchQuery})`,
          )!,
        );
      }

      if (statusFilter === "due") {
        filters.push(lte(residents.nextRentDueDate, today));
      } else if (statusFilter === "paid") {
        filters.push(
          and(
            gt(residents.nextRentDueDate, today),
            isNotNull(residents.lastPaymentDate),
            or(
              sql`date_trunc('day', ${residents.lastPaidForDueDate}) = date_trunc('day', ${residents.nextRentDueDate})`,
              and(
                gte(
                  residents.lastPaymentDate,
                  sql`${residents.nextRentDueDate} - interval '1 month'`,
                ),
                lt(residents.lastPaymentDate, residents.nextRentDueDate),
              ),
            )!,
          )!,
        );
      }

      const result = await db
        .select({
          resident: residents,
          room: rooms,
          roomType: propertyRoomTypes,
        })
        .from(residents)
        .leftJoin(
          rooms,
          and(
            eq(residents.roomId, rooms.id),
            eq(rooms.propertyId, ctx.propertyId),
          ),
        )
        .leftJoin(propertyRoomTypes, eq(rooms.typeId, propertyRoomTypes.id))
        .where(and(...filters))
        .orderBy(desc(residents.createdAt))
        .limit(limit);

      const mapped = result.map(({ resident, room, roomType }) => ({
        ...resident,
        checkInDate: resident.checkInDate.toISOString(),
        nextRentDueDate: resident.nextRentDueDate.toISOString(),
        lastPaymentDate: resident.lastPaymentDate?.toISOString(),
        checkOutDate: resident.checkOutDate?.toISOString(),
        room: room
          ? {
              ...room,
              type: roomType,
            }
          : null,
      }));

      return mapped;
    }),

  update: propertyProcedure
    .input(updateResidentSchema)
    .mutation(async ({ input, ctx }) => {
      // Verify resident belongs to property
      const currentResident = await db.query.residents.findFirst({
        where: (r, { eq, and }) =>
          and(eq(r.id, input.id), eq(r.propertyId, ctx.propertyId)),
      });

      if (!currentResident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resident not found or access denied",
        });
      }

      const updateData: ResidentUpdateData = {};

      if (input.name) updateData.name = input.name;
      if (input.profileImage) updateData.profileImage = input.profileImage;
      if (input.rentAmount !== undefined)
        updateData.rentAmount = input.rentAmount;
      if (input.advanceMonths !== undefined)
        updateData.advanceMonths = input.advanceMonths;

      // Handle Dates
      if (input.checkInDate) {
        updateData.checkInDate = parseDdMmYyyyDate(input.checkInDate);
      }
      if (input.checkOutDate) {
        updateData.checkOutDate = parseDdMmYyyyDate(input.checkOutDate);
      } else if (input.checkOutDate === null) {
        updateData.checkOutDate = null;
      }

      // Handle Room Change
      if (input.roomId) {
        const targetRoomId = input.roomId;
        // Verify target room exists AND belongs to the same property
        const room = await db.query.rooms.findFirst({
          where: (r, { eq, and }) =>
            and(eq(r.id, targetRoomId), eq(r.propertyId, ctx.propertyId)),
        });
        if (!room) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Target room not found or access denied",
          });
        }
        updateData.roomId = input.roomId;
        // propertyId remains same
      }

      // Recalculate Next Rent Due Date
      if (updateData.checkInDate || updateData.advanceMonths !== undefined) {
        const effectiveCheckIn =
          updateData.checkInDate || currentResident.checkInDate;
        const effectiveAdvance =
          updateData.advanceMonths ?? currentResident.advanceMonths ?? 0;

        const calculatedNextRentDueDate = calculateNextRentDueDate(
          effectiveCheckIn,
          effectiveAdvance,
        );

        if (
          currentResident.nextRentDueDate &&
          isBefore(calculatedNextRentDueDate, currentResident.nextRentDueDate)
        ) {
          updateData.nextRentDueDate = currentResident.nextRentDueDate;
        } else {
          updateData.nextRentDueDate = calculatedNextRentDueDate;
        }
      }

      const updated = await db.transaction(async (tx) => {
        if (input.phoneNumber) {
          const { userId, phoneNumber } =
            await residentIdentityService.validateResidentUpdatePhone(
              tx,
              input.id,
              input.phoneNumber,
            );

          updateData.userId = userId;
          updateData.phoneNumber = phoneNumber;
        }

        const [saved] = await tx
          .update(residents)
          .set(updateData)
          .where(
            and(
              eq(residents.id, input.id),
              eq(residents.propertyId, ctx.propertyId),
            ),
          )
          .returning();

        return saved;
      });

      const previousImageKey = resolveManagedS3Key(currentResident.profileImage);
      const nextImageKey = resolveManagedS3Key(updated.profileImage);
      const imageChanged =
        previousImageKey && previousImageKey !== nextImageKey;

      if (imageChanged) {
        await deleteS3Object(previousImageKey).catch(() => undefined);
      }

      return {
        ...updated,
        checkInDate: updated.checkInDate.toISOString(),
        checkOutDate: updated.checkOutDate?.toISOString(),
        nextRentDueDate: updated.nextRentDueDate.toISOString(),
        lastPaymentDate: updated.lastPaymentDate?.toISOString(),
      };
    }),

  checkout: propertyProcedure
    .input(checkoutResidentSchema)
    .mutation(async ({ input, ctx }) => {
      return await db.transaction(async (tx) => {
        const resident = await tx.query.residents.findFirst({
          where: (r, { eq, and }) =>
            and(eq(r.id, input.residentId), eq(r.propertyId, ctx.propertyId)),
          with: {
            room: {
              with: {
                type: true,
              },
            },
          },
        });

        if (!resident) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resident not found or access denied",
          });
        }

        let checkoutDate = new Date();
        if (input.checkoutDate) {
          checkoutDate = parseDdMmYyyyDate(input.checkoutDate);
        }

        await tx.insert(checkouts).values({
          id: crypto.randomUUID(),
          propertyId: resident.propertyId,
          name: resident.name,
          phoneNumber: resident.phoneNumber,
          profileImage: resident.profileImage,
          checkInDate: resident.checkInDate,
          checkOutDate: checkoutDate,
          roomNumber: resident.room.roomNumber,
          roomType: resident.room.type?.name || "Unknown",
          isAc: resident.room.ac || false,
          roomId: resident.roomId,
          rentAmount: resident.rentAmount,
        });

        await tx
          .delete(residents)
          .where(
            and(
              eq(residents.id, input.residentId),
              eq(residents.propertyId, ctx.propertyId),
            ),
          );

        return { success: true };
      });
    }),

  listCheckouts: propertyProcedure
    .input(listCheckoutsSchema)
    .query(async ({ ctx, input }) => {
      const searchQuery = input?.q?.trim();

      const filters = [eq(checkouts.propertyId, ctx.propertyId)];
      if (searchQuery) {
        filters.push(
          sql`(
            setweight(to_tsvector('english', coalesce(${checkouts.name}, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(${checkouts.roomNumber}, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(${checkouts.phoneNumber}, '')), 'C')
          ) @@ websearch_to_tsquery('english', ${searchQuery})`,
        );
      }

      const result = await db.query.checkouts.findMany({
        where: and(...filters),
        orderBy: desc(checkouts.createdAt),
        limit: input?.limit ?? 100,
        with: {
          property: true,
        },
      });

      return result.map((r) => ({
        ...r,
        checkInDate: r.checkInDate.toISOString(),
        checkOutDate: r.checkOutDate.toISOString(),
      }));
    }),

  // ─── Resident-facing procedures (JWT only, no x-property-id) ───────────────

  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const resident = await findActiveResidentByUserId(ctx.user.id);

    if (!resident) return null;

    const residentWithRelations = await db.query.residents.findFirst({
      where: (r, { eq }) => eq(r.id, resident.id),
      with: {
        room: { with: { type: true } },
        property: true,
      },
    });

    if (!residentWithRelations) return null;

    return {
      ...residentWithRelations,
      checkInDate: residentWithRelations.checkInDate.toISOString(),
      checkOutDate: residentWithRelations.checkOutDate?.toISOString() ?? null,
      nextRentDueDate: residentWithRelations.nextRentDueDate.toISOString(),
      lastPaymentDate:
        residentWithRelations.lastPaymentDate?.toISOString() ?? null,
      createdAt: residentWithRelations.createdAt.toISOString(),
      updatedAt: residentWithRelations.updatedAt.toISOString(),
    };
  }),

  getMyComplaints: protectedProcedure
    .input(listMyComplaintsSchema)
    .query(async ({ ctx, input }) => {
    const resident = await findActiveResidentByUserId(ctx.user.id);

    if (!resident) return [];
    const limit = input?.limit ?? 100;

    const result = await db
      .select()
      .from(complaints)
      .where(eq(complaints.residentId, resident.id))
      .orderBy(desc(complaints.createdAt))
      .limit(limit);

      return result.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      resolvedAt: c.resolvedAt?.toISOString() ?? null,
      }));
    }),

  getMyLatestActiveNotice: protectedProcedure.query(async ({ ctx }) => {
    const resident = await findActiveResidentByUserId(ctx.user.id);

    if (!resident) return null;

    // Lazy expiration of notices for this resident's property.
    await db
      .update(notices)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(notices.propertyId, resident.propertyId),
          eq(notices.isActive, true),
          isNotNull(notices.validUntil),
          lt(notices.validUntil, new Date()),
        ),
      );

    const latestNotice = await db.query.notices.findFirst({
      where: and(
        eq(notices.propertyId, resident.propertyId),
        eq(notices.isActive, true),
      ),
      orderBy: desc(notices.createdAt),
    });

    if (!latestNotice) return null;

    return {
      ...latestNotice,
      validFrom: latestNotice.validFrom.toISOString(),
      validUntil: latestNotice.validUntil?.toISOString() ?? null,
      createdAt: latestNotice.createdAt.toISOString(),
      updatedAt: latestNotice.updatedAt.toISOString(),
    };
  }),

  createMyComplaint: protectedProcedure
    .input(createMyComplaintSchema)
    .mutation(async ({ input, ctx }) => {
      const resident = await findActiveResidentByUserId(ctx.user.id);

      if (!resident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active tenancy found for your account.",
        });
      }

      const [created] = await db
        .insert(complaints)
        .values({
          id: crypto.randomUUID(),
          propertyId: resident.propertyId,
          residentId: resident.id,
          roomId: resident.roomId,
          title: input.title,
          description: input.description,
        })
        .returning();

      return {
        ...created,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        resolvedAt: created.resolvedAt?.toISOString() ?? null,
      };
    }),

  deleteMyComplaint: protectedProcedure
    .input(myComplaintIdSchema)
    .mutation(async ({ input, ctx }) => {
      const resident = await findActiveResidentByUserId(ctx.user.id);

      if (!resident) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active tenancy found for your account.",
        });
      }

      const deleted = await db
        .delete(complaints)
        .where(
          and(
            eq(complaints.id, input.id),
            eq(complaints.residentId, resident.id),
          ),
        )
        .returning({ id: complaints.id });

      if (deleted.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Complaint not found.",
        });
      }

      return { success: true };
    }),
});
