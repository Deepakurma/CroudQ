import { z } from "zod";
import { contentTypeSchema } from "../media/dto";
import { MAX_IMAGE_UPLOAD_SIZE_BYTES } from "../../services/s3-sender";

export const inviteCodeSchema = z
  .string()
  .trim()
  .min(6)
  .max(32)
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid invite code");

export const submitRequestSchema = z.object({
  inviteCode: inviteCodeSchema,
  name: z.string().trim().min(3).max(100),
  phoneNumber: z.string().trim().min(10),
  verificationToken: z.string().min(10),
  durationMonths: z.number().int().positive().max(60).optional(),
  profileImage: z.string().trim().max(2_000_000).optional(),
});

export const getInviteByCodeSchema = z.object({ inviteCode: inviteCodeSchema });

export const verifyInviteOtpSchema = z.object({
  phoneNumber: z.string().trim().min(10),
  inviteCode: inviteCodeSchema,
  otp: z.string().regex(/^\d{4}$/),
  reqId: z.string().min(1),
});

export const getJoinStatusSchema = z.object({ inviteCode: inviteCodeSchema });

export const generatePublicJoinUploadUrlSchema = z.object({
  inviteCode: inviteCodeSchema,
  fileName: z.string().trim().min(1).max(255),
  contentType: contentTypeSchema,
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_IMAGE_UPLOAD_SIZE_BYTES),
});

export type InviteCodeType = z.infer<typeof inviteCodeSchema>;
export type SubmitRequestType = z.infer<typeof submitRequestSchema>;
export type GetInviteByCodeType = z.infer<typeof getInviteByCodeSchema>;
export type VerifyInviteOtpType = z.infer<typeof verifyInviteOtpSchema>;
export type GetJoinStatusType = z.infer<typeof getJoinStatusSchema>;
export type GeneratePublicJoinUploadUrlType = z.infer<typeof generatePublicJoinUploadUrlSchema>;
