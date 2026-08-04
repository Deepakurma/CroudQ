import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password is too long");

export const signupInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80)
    .optional(),
  email: z.string().email(),
  password: passwordSchema,
});

export const verifySignupOtpInputSchema = z.object({
  email: z.string().email(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit verification code"),
});

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

export const requestPasswordResetInputSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url().optional(),
});

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

export const updateProfileInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  currentPassword: z.string().min(1, "Current password is required").max(128),
});
