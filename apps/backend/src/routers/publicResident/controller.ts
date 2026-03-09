import { TRPCError } from "@trpc/server";
import { addMonths, startOfDay } from "date-fns";
import { and, desc, eq, or } from "drizzle-orm";

import { db } from "../../db";
import { residentJoinRequests, residents, users } from "../../db/schema";
import { authService } from "../../services/authService";
import {
  createS3ObjectKey,
  generateUploadUrl,
  getS3FileUrl,
} from "../../services/s3-sender";
import { protectedProcedure, publicProcedure, router } from "../../server/trpc";
import { setResidentAuthCookies } from "../../utils/authCookies";
import { signJoinSubmitToken, verifyJoinSubmitToken } from "../../utils/jwt";
import { normalizeIndianPhone } from "../../utils/phone";
import {
  generatePublicJoinUploadUrlSchema,
  getInviteByCodeSchema,
  getJoinStatusSchema,
  submitRequestSchema,
  verifyInviteOtpSchema,
} from "./dto";

const statusResponseShape = (request: {
  id: string;
  status: "invited" | "submitted" | "approved" | "rejected" | "expired";
  inviteCode: string;
  inviteExpiresAt: Date;
  property: { id: string; name: string };
  room: {
    id: string;
    roomNumber: string;
    type: { name: string | null; rentAmount?: number | null } | null;
    ac: boolean | null;
    customRentAmount?: number | null;
  } | null;
}) => ({
  id: request.id,
  status: request.status,
  inviteCode: request.inviteCode,
  inviteExpiresAt: request.inviteExpiresAt.toISOString(),
  property: {
    id: request.property.id,
    name: request.property.name,
  },
  room: request.room
    ? {
      id: request.room.id,
      roomNumber: request.room.roomNumber,
      roomType: request.room.type?.name || "Unknown",
      isAc: request.room.ac || false,
      rentAmount: request.room.customRentAmount ?? request.room.type?.rentAmount ?? null,
    }
    : null,
});

const markInviteExpiredIfNeeded = async (request: typeof residentJoinRequests.$inferSelect) => {
  if (request.inviteExpiresAt >= new Date()) {
    return request;
  }

  if (request.status === "invited" || request.status === "submitted") {
    const [updated] = await db
      .update(residentJoinRequests)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(eq(residentJoinRequests.id, request.id))
      .returning();
    return updated;
  }

  return request;
};

export const publicResidentRouter = router({
  generateUploadUrl: publicProcedure
    .input(generatePublicJoinUploadUrlSchema)
    .mutation(async ({ input }) => {
      const request = await db.query.residentJoinRequests.findFirst({
        where: eq(residentJoinRequests.inviteCode, input.inviteCode),
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite link not found." });
      }

      const normalized = await markInviteExpiredIfNeeded(request);
      if (normalized.status !== "invited") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invite is no longer active.",
        });
      }

      try {
        const key = createS3ObjectKey("resident", normalized.propertyId, input.contentType);
        const uploadUrl = await generateUploadUrl(key, input.contentType, input.fileSizeBytes);
        const fileUrl = getS3FileUrl(key);
        return {
          uploadUrl,
          key,
          fileUrl,
          expiresInSeconds: 300,
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create upload URL.",
        });
      }
    }),

  getInviteByCode: publicProcedure
    .input(getInviteByCodeSchema)
    .query(async ({ input }) => {
      const request = await db.query.residentJoinRequests.findFirst({
        where: and(
          eq(residentJoinRequests.inviteCode, input.inviteCode),
          or(
            eq(residentJoinRequests.status, "invited"),
            eq(residentJoinRequests.status, "submitted"),
            eq(residentJoinRequests.status, "approved"),
            eq(residentJoinRequests.status, "rejected"),
            eq(residentJoinRequests.status, "expired"),
          )!,
        ),
        with: {
          property: true,
          room: {
            with: {
              type: true,
            },
          },
        },
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite link not found." });
      }

      const normalized = await markInviteExpiredIfNeeded(request);

      const inviteState: "active" | "expired" | "closed" =
        normalized.status === "invited"
          ? "active"
          : normalized.status === "expired"
            ? "expired"
            : "closed";

      return {
        inviteState,
        allowSubmission: normalized.status === "invited",
        property: {
          name: request.property.name,
        },
        room: request.room
          ? {
            roomNumber: request.room.roomNumber,
            roomType: request.room.type?.name || "Unknown",
            isAc: request.room.ac || false,
            rentAmount: request.room.customRentAmount ?? request.room.type?.rentAmount ?? null,
          }
          : null,
      };
    }),

  submitRequest: publicProcedure
    .input(submitRequestSchema)
    .mutation(async ({ input }) => {
      const tokenPayload = verifyJoinSubmitToken(input.verificationToken);
      if (!tokenPayload?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "OTP verification is required before submitting the request.",
        });
      }

      const normalizedPhone = normalizeIndianPhone(input.phoneNumber);
      if (tokenPayload.inviteCode !== input.inviteCode) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Verification token does not match invite.",
        });
      }
      if (normalizeIndianPhone(tokenPayload.phoneNumber) !== normalizedPhone) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Verification token does not match phone number.",
        });
      }

      const authedUser = await db.query.users.findFirst({
        where: eq(users.id, tokenPayload.userId),
      });

      if (!authedUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unable to verify this OTP session. Please verify again.",
        });
      }

      if (normalizeIndianPhone(authedUser.phoneNumber || "") !== normalizedPhone) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verified phone number does not match the submitted phone number.",
        });
      }

      const request = await db.query.residentJoinRequests.findFirst({
        where: eq(residentJoinRequests.inviteCode, input.inviteCode),
        with: {
          room: {
            with: {
              type: true,
            },
          },
        },
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite link not found." });
      }

      const normalizedRequest = await markInviteExpiredIfNeeded(request);

      if (normalizedRequest.status !== "invited") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            normalizedRequest.status === "submitted"
              ? "This request is already submitted and pending approval."
              : "This invite is no longer active.",
        });
      }

      if (!request.room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found for this invite." });
      }

      const activeOccupants = await db
        .select({ roomId: residents.roomId })
        .from(residents)
        .where(
          and(
            eq(residents.propertyId, request.propertyId),
            eq(residents.roomId, request.roomId),
            eq(residents.status, "active"),
          ),
        );

      const currentOccupancy = activeOccupants.length;
      const capacity = request.room.type?.maxOccupancy || 1;
      if (currentOccupancy >= capacity) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This room is currently full. Please contact the property manager.",
        });
      }

      const checkInDate = startOfDay(new Date());
      const checkOutDate =
        input.durationMonths && input.durationMonths > 0
          ? addMonths(checkInDate, input.durationMonths)
          : null;

      const defaultRentAmount =
        request.room.customRentAmount ??
        request.room.type?.rentAmount ??
        null;

      await db
        .update(residentJoinRequests)
        .set({
          status: "submitted",
          submittedName: input.name,
          submittedPhoneNumber: normalizedPhone,
          submittedCheckInDate: checkInDate,
          submittedCheckOutDate: checkOutDate,
          submittedRentAmount: defaultRentAmount,
          submittedAdvanceMonths: 0,
          submittedDurationMonths: input.durationMonths || null,
          submittedProfileImage: input.profileImage || null,
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(residentJoinRequests.id, request.id));

      return {
        success: true,
        message: "Request submitted. The property manager will review it shortly.",
      };
    }),

  verifyInviteOtp: publicProcedure
    .input(verifyInviteOtpSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await authService.verifyOTP(input.phoneNumber, input.otp, input.reqId);
      const roles = result.identity.roles;
      if (roles.includes("LANDLORD") || roles.includes("SUPER_ADMIN")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This phone number is linked to a landlord account and cannot be used for resident self-onboarding.",
        });
      }

      if (roles.includes("RESIDENT")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This phone number is already linked to an active resident account.",
        });
      }

      const verificationToken = signJoinSubmitToken({
        userId: result.identity.userId,
        phoneNumber: normalizeIndianPhone(input.phoneNumber),
        inviteCode: input.inviteCode,
      });
      setResidentAuthCookies(ctx.res, result.token);

      return {
        success: true,
        verificationToken,
        authToken: result.token,
      };
    }),

  getMyJoinRequestStatus: protectedProcedure
    .input(getJoinStatusSchema)
    .query(async ({ input, ctx }) => {
      const request = await db.query.residentJoinRequests.findFirst({
        where: eq(residentJoinRequests.inviteCode, input.inviteCode),
        with: {
          property: true,
          room: {
            with: {
              type: true,
            },
          },
        },
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite link not found." });
      }

      const normalized = await markInviteExpiredIfNeeded(request);

      const authPhone = normalizeIndianPhone(ctx.user.phoneNumber || "");
      const submittedPhone = normalizeIndianPhone(normalized.submittedPhoneNumber || "");

      if (!authPhone || !submittedPhone || authPhone !== submittedPhone) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invite status is not accessible for your account.",
        });
      }

      return statusResponseShape({
        id: normalized.id,
        status: normalized.status as "invited" | "submitted" | "approved" | "rejected" | "expired",
        inviteCode: normalized.inviteCode,
        inviteExpiresAt: normalized.inviteExpiresAt,
        property: request.property,
        room: request.room,
      });
    }),

  getMyJoinOrResidencyStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const activeResident = await db.query.residents.findFirst({
        where: and(
          eq(residents.userId, ctx.user.id),
          eq(residents.active, true),
          eq(residents.status, "active"),
        ),
        with: {
          property: true,
          room: {
            with: {
              type: true,
            },
          },
        },
      });

      if (activeResident) {
        return {
          status: "approved" as const,
          source: "active_tenancy" as const,
          property: {
            id: activeResident.property.id,
            name: activeResident.property.name,
          },
          room: activeResident.room
            ? {
              id: activeResident.room.id,
              roomNumber: activeResident.room.roomNumber,
              roomType: activeResident.room.type?.name || "Unknown",
            }
            : null,
        };
      }

      const authPhone = normalizeIndianPhone(ctx.user.phoneNumber || "");
      if (!authPhone) {
        return {
          status: "none" as const,
          source: "no_records" as const,
        };
      }

      const latestRequest = await db.query.residentJoinRequests.findFirst({
        where: eq(residentJoinRequests.submittedPhoneNumber, authPhone),
        orderBy: desc(residentJoinRequests.updatedAt),
        with: {
          property: true,
          room: {
            with: {
              type: true,
            },
          },
        },
      });

      if (!latestRequest) {
        return {
          status: "none" as const,
          source: "no_records" as const,
        };
      }

      const normalized = await markInviteExpiredIfNeeded(latestRequest);
      return {
        status: normalized.status as "invited" | "submitted" | "approved" | "rejected" | "expired",
        source: "latest_request" as const,
        inviteCode: normalized.inviteCode,
        property: {
          id: latestRequest.property.id,
          name: latestRequest.property.name,
        },
        room: latestRequest.room
          ? {
            id: latestRequest.room.id,
            roomNumber: latestRequest.room.roomNumber,
            roomType: latestRequest.room.type?.name || "Unknown",
          }
          : null,
      };
    }),
});
