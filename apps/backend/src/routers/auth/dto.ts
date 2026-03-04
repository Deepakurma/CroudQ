import { z } from "zod";

import { normalizeIndianPhone } from "../../utils/phone";

export const phoneSchema = z
    .string()
    .transform((value) => normalizeIndianPhone(value))
    .refine((value) => /^[0-9]{10}$/.test(value), "Phone number must be 10 digits");

const OTP_LENGTH = 4;

export const sendOtpSchema = z.object({ phoneNumber: phoneSchema });

export const retryOtpSchema = z.object({
    phoneNumber: phoneSchema,
    reqId: z.string().trim().min(1),
    retryChannel: z.union([z.literal(4), z.literal(11)]).optional(),
});

export const verifyOtpSchema = z.object({
    phoneNumber: phoneSchema,
    otp: z
        .string()
        .regex(new RegExp(`^[0-9]{${OTP_LENGTH}}$`), `OTP must be ${OTP_LENGTH} digits`),
    reqId: z.string().trim().min(1),
});

export const setupSuperAdminSchema = z.object({
    phoneNumber: phoneSchema,
});

export type SendOtpType = z.infer<typeof sendOtpSchema>;
export type RetryOtpType = z.infer<typeof retryOtpSchema>;
export type VerifyOtpType = z.infer<typeof verifyOtpSchema>;
export type SetupSuperAdminType = z.infer<typeof setupSuperAdminSchema>;
