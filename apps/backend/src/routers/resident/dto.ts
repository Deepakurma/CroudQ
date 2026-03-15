import { z } from "zod";

export const createResidentSchema = z.object({
  roomId: z.string(),
  roomNumber: z.string(),
  name: z.string(),
  phoneNumber: z.string(),
  profileImage: z.string().nullable().optional(),
  checkInDate: z.string(),
  rentAmount: z.number().positive().max(200000),
  advanceMonths: z.number().optional(),
  durationMonths: z.number().optional(),
});

export const roomIdSchema = z.object({ roomId: z.string() });

export const approveRequestSchema = z.object({
  requestId: z.string(),
  roomId: z.string().optional(),
  rentAmount: z.number().int().positive().max(200000).optional(),
  checkInDate: z.string().optional(),
  advanceMonths: z.number().int().min(0).max(24).optional(),
  durationMonths: z.number().int().min(0).max(120).optional(),
});

export const rejectRequestSchema = z.object({
  requestId: z.string(),
  reason: z.string().trim().optional(),
});

export const residentIdSchema = z.object({ residentId: z.string() });
export const paymentHistorySchema = z.object({
  residentId: z.string(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const getResidentsByRoomSchema = z.object({
  roomId: z.string(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const listResidentsSchema = z
  .object({
    status: z.enum(["all", "paid", "due", "pending_checkout"]).optional(),
    q: z.string().trim().min(1).max(100).optional(),
    limit: z.number().int().min(1).max(200).optional(),
    scopePropertyId: z.string().trim().min(1).optional(),
  })
  .optional();

export const updateResidentSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  phoneNumber: z.string().optional(),
  roomId: z.string().optional(),
  roomNumber: z.string().optional(),
  rentAmount: z.number().positive().max(200000).optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional().nullable(),
  profileImage: z.string().nullable().optional(),
  advanceMonths: z.number().optional(),
});

export const checkoutResidentSchema = z.object({
  residentId: z.string(),
  checkoutDate: z.string().optional(),
});

export const listCheckoutsSchema = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
    limit: z.number().int().min(1).max(200).optional(),
    scopePropertyId: z.string().trim().min(1).optional(),
  })
  .optional();

export const listPendingApprovalsSchema = z
  .object({
    limit: z.number().int().min(1).max(200).optional(),
    scopePropertyId: z.string().trim().min(1).optional(),
  })
  .optional();

export const listMyComplaintsSchema = z
  .object({
    limit: z.number().int().min(1).max(200).optional(),
  })
  .optional();

export const createMyComplaintSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export const myComplaintIdSchema = z.object({
  id: z.string().min(1),
});

export type CreateResidentType = z.infer<typeof createResidentSchema>;
export type RoomIdType = z.infer<typeof roomIdSchema>;
export type ApproveRequestType = z.infer<typeof approveRequestSchema>;
export type RejectRequestType = z.infer<typeof rejectRequestSchema>;
export type ResidentIdType = z.infer<typeof residentIdSchema>;
export type PaymentHistoryType = z.infer<typeof paymentHistorySchema>;
export type GetResidentsByRoomType = z.infer<typeof getResidentsByRoomSchema>;
export type ListResidentsType = z.infer<typeof listResidentsSchema>;
export type UpdateResidentType = z.infer<typeof updateResidentSchema>;
export type CheckoutResidentType = z.infer<typeof checkoutResidentSchema>;
export type ListCheckoutsType = z.infer<typeof listCheckoutsSchema>;
export type ListPendingApprovalsType = z.infer<typeof listPendingApprovalsSchema>;
export type ListMyComplaintsType = z.infer<typeof listMyComplaintsSchema>;
export type CreateMyComplaintType = z.infer<typeof createMyComplaintSchema>;
export type MyComplaintIdType = z.infer<typeof myComplaintIdSchema>;
