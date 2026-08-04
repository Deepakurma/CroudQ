import { createHash, randomBytes, randomInt } from "crypto";

import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
import { and, desc, eq, gt, isNull } from "drizzle-orm";

import { db } from "../../db";
import {
  passwordResetTokens,
  signupEmailOtps,
  userCredentials,
  users,
} from "../../db/schema";
import { sendEmail } from "../email/controller";

type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  handle: string | null;
  deletionRequestedAt: string | null;
  scheduledDeletionAt: string | null;
};

const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const SIGNUP_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_SALT_ROUNDS = 12;
const ACCOUNT_DELETION_GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const toAuthUser = (user: {
  id: string;
  name: string | null;
  email: string;
  deletionRequestedAt?: Date | null;
  scheduledDeletionAt?: Date | null;
}): AuthUser => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    handle: null,
    deletionRequestedAt: user.deletionRequestedAt?.toISOString() ?? null,
    scheduledDeletionAt: user.scheduledDeletionAt?.toISOString() ?? null,
  };
};

const getBrowserResetBaseUrl = () => {
  const frontendUrl = process.env.FRONTEND_URL?.trim();

  if (!frontendUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL("/reset-password", frontendUrl);

    return parsedUrl.toString();
  } catch {
    return null;
  }
};

const buildResetLink = (token: string) => {
  const baseUrl = getBrowserResetBaseUrl();

  if (!baseUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Password reset is not configured",
    });
  }

  const url = new URL(baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
};

const hashResetToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const hashSignupOtp = (email: string, code: string) =>
  createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}`)
    .digest("hex");

const isUsersEmailUniqueConstraintError = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const { code, message } = error as {
    code?: string;
    message?: string;
  };

  return (
    code === "23505" ||
    message?.includes("users_email_lower_unique_idx") ||
    message?.includes("duplicate key value violates unique constraint")
  );
};

const generateSignupOtp = () => `${randomInt(0, 1000000)}`.padStart(6, "0");

export const requestSignupOtp = async (input: {
  email: string;
  password: string;
  name?: string | null;
}) => {
  const email = normalizeEmail(input.email);

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "An account with this email already exists",
    });
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
  const code = generateSignupOtp();
  const codeHash = hashSignupOtp(email, code);
  const now = new Date();

  console.log("Before transaction");

  await db.transaction(async (tx) => {
    await tx
      .update(signupEmailOtps)
      .set({
        usedAt: now,
      })
      .where(
        and(eq(signupEmailOtps.email, email), isNull(signupEmailOtps.usedAt)),
      );

    await tx.insert(signupEmailOtps).values({
      email,
      name: input.name?.trim() || null,
      passwordHash,
      codeHash,
      expiresAt: new Date(now.getTime() + SIGNUP_OTP_TTL_MS),
    });
  });

  // await sendEmail(email, "Verify your CroudQ email", "signup-otp", {
  //   email,
  //   code,
  // });

  console.log("Signup OTP:", code);

  return {
    success: true,
    message: "We sent a 6-digit verification code to your email.",
  };
};

export const verifySignupOtp = async (input: {
  email: string;
  code: string;
}) => {
  const email = normalizeEmail(input.email);
  // const code = input.code.trim();

  const signupOtp = await db.query.signupEmailOtps.findFirst({
    where: and(
      eq(signupEmailOtps.email, email),
      // eq(signupEmailOtps.codeHash, hashSignupOtp(email, code)),
      isNull(signupEmailOtps.usedAt),
      gt(signupEmailOtps.expiresAt, new Date()),
    ),
    orderBy: [desc(signupEmailOtps.createdAt)],
  });

  if (!signupOtp) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This verification code is invalid or expired",
    });
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "An account with this email already exists",
    });
  }

  const now = new Date();

  try {
    return await db.transaction(async (tx) => {
      await tx
        .update(signupEmailOtps)
        .set({
          usedAt: now,
        })
        .where(
          and(eq(signupEmailOtps.email, email), isNull(signupEmailOtps.usedAt)),
        );

      const [createdUser] = await tx
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email,
          emailVerifiedAt: now,
          name: signupOtp.name?.trim() || null,
          updatedAt: now,
        })
        .returning();

      await tx.insert(userCredentials).values({
        userId: createdUser.id,
        passwordHash: signupOtp.passwordHash,
        updatedAt: now,
      });

      return {
        user: toAuthUser(createdUser),
      };
    });
  } catch (error) {
    if (isUsersEmailUniqueConstraintError(error)) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An account with this email already exists",
      });
    }

    throw error;
  }
};

export const loginWithEmail = async (input: {
  email: string;
  password: string;
}) => {
  const email = normalizeEmail(input.email);
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
  }

  const credentials = await db.query.userCredentials.findFirst({
    where: eq(userCredentials.userId, user.id),
  });

  if (!credentials) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    credentials.passwordHash,
  );

  if (!passwordMatches) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
  }

  return credentials;
};

export const requestAccountDeletion = async (userId: string) => {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!existingUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  if (
    existingUser.scheduledDeletionAt &&
    existingUser.scheduledDeletionAt.getTime() > Date.now()
  ) {
    return toAuthUser(existingUser);
  }

  const now = new Date();
  const scheduledDeletionAt = new Date(
    now.getTime() + ACCOUNT_DELETION_GRACE_PERIOD_MS,
  );

  const [updatedUser] = await db
    .update(users)
    .set({
      deletionRequestedAt: now,
      scheduledDeletionAt,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();

  return toAuthUser(updatedUser);
};

export const cancelAccountDeletion = async (userId: string) => {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!existingUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      deletionRequestedAt: null,
      scheduledDeletionAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return toAuthUser(updatedUser);
};

export const updateProfileWithPassword = async (
  userId: string,
  input: {
    name: string;
    currentPassword: string;
  },
) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  const credentials = await db.query.userCredentials.findFirst({
    where: eq(userCredentials.userId, user.id),
  });

  if (!credentials) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  const passwordMatches = await bcrypt.compare(
    input.currentPassword,
    credentials.passwordHash,
  );

  if (!passwordMatches) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Current password is incorrect",
    });
  }

  try {
    const [updatedUser] = await db
      .update(users)
      .set({
        name: input.name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    return toAuthUser(updatedUser);
  } catch (error) {
    if (isUsersEmailUniqueConstraintError(error)) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An account with this email already exists",
      });
    }

    throw error;
  }
};

export const updateChannelType = async (userId: string) => {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!existingUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return toAuthUser(updatedUser);
};

export const requestPasswordReset = async (input: {
  email: string;
  redirectTo?: string | null;
}) => {
  const email = normalizeEmail(input.email);
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return {
      success: true,
      message: "If an account exists, a reset link has been sent.",
    };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const resetLink = buildResetLink(rawToken);
  const now = new Date();

  await db
    .update(passwordResetTokens)
    .set({
      usedAt: now,
    })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
      ),
    );

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  await sendEmail(user.email, "Reset your CroudQ password", "reset-password", {
    resetLink,
    email: user.email,
  });

  return {
    success: true,
    message: "If an account exists, a reset link has been sent.",
  };
};

export const resetPassword = async (input: {
  token: string;
  password: string;
}) => {
  const tokenHash = hashResetToken(input.token);

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date()),
    ),
  });

  if (!resetToken) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This password reset link is invalid or expired",
    });
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
  const now = new Date();

  await db
    .update(userCredentials)
    .set({
      passwordHash,
      updatedAt: now,
    })
    .where(eq(userCredentials.userId, resetToken.userId));

  await db
    .update(passwordResetTokens)
    .set({
      usedAt: now,
    })
    .where(
      and(
        eq(passwordResetTokens.userId, resetToken.userId),
        isNull(passwordResetTokens.usedAt),
      ),
    );

  return {
    success: true,
    message: "Password updated successfully",
  };
};
