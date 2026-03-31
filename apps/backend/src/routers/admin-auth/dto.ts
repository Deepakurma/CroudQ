import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password is too long");

export const adminLoginInputSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

export const createAdminInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional(),
  email: z.string().email(),
  password: passwordSchema,
});

export const requestAdminPasswordResetInputSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url().optional(),
});

export const resetAdminPasswordInputSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});
