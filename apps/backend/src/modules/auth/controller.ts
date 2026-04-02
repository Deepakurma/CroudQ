import { createHash, randomBytes, randomInt } from "crypto";

import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
import { and, desc, eq, gt, inArray, isNull, or } from "drizzle-orm";

import { db } from "../../db";
import {
  admins,
  authSessions,
  passwordResetTokens,
  signupEmailOtps,
  revokedTokens,
  userCredentials,
  users,
  webLoginTokens,
} from "../../db/schema";
import {
  getCurrentUserSubscriptionState,
  getCurrentUserTier,
} from "../billing/controller";
import { sendEmail } from "../email/controller";
import { signJwt, verifyJwt } from "../../utils/jwt";

type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  handle: string | null;
  tier: string | null;
  subscriptionState: "active" | "ended" | "none";
  deletionRequestedAt: string | null;
  scheduledDeletionAt: string | null;
};

const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const SIGNUP_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_SALT_ROUNDS = 12;
const DEFAULT_ACCESS_TOKEN_TTL = "15m";
const DEFAULT_REFRESH_TOKEN_TTL = "30d";
const ACCOUNT_DELETION_GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;
const WEB_LOGIN_TOKEN_TTL_MS = 10 * 60 * 1000;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const toAuthUser = async (user: {
  id: string;
  name: string | null;
  email: string;
  deletionRequestedAt?: Date | null;
  scheduledDeletionAt?: Date | null;
}): Promise<AuthUser> => ({
  id: user.id,
  name: user.name,
  email: user.email,
  handle: null,
  tier: await getCurrentUserTier(user.id),
  subscriptionState: await getCurrentUserSubscriptionState(user.id),
  deletionRequestedAt: user.deletionRequestedAt?.toISOString() ?? null,
  scheduledDeletionAt: user.scheduledDeletionAt?.toISOString() ?? null,
});

const getBrowserResetBaseUrl = () => {
  const frontendUrl = process.env.FRONTEND_URL?.trim();

  if (!frontendUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL("/reset-password", frontendUrl);

    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString();
    }
  } catch {
    return null;
  }

  return null;
};

const getAllowedResetRedirect = (redirectTo?: string) => {
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  const trimmedRedirectTo = redirectTo?.trim();

  if (!frontendUrl || !trimmedRedirectTo) {
    return null;
  }

  try {
    const frontendOrigin = new URL(frontendUrl).origin;
    const parsedRedirect = new URL(trimmedRedirectTo);

    if (
      (parsedRedirect.protocol === "http:" ||
        parsedRedirect.protocol === "https:") &&
      parsedRedirect.origin === frontendOrigin
    ) {
      return parsedRedirect.toString();
    }
  } catch {
    return null;
  }

  return null;
};

const buildResetLink = (token: string, redirectTo?: string) => {
  const baseUrl =
    getAllowedResetRedirect(redirectTo) || getBrowserResetBaseUrl();

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

const hashRefreshToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const hashWebLoginToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const isUsersEmailUniqueConstraintError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code =
    "code" in error && typeof error.code === "string" ? error.code : null;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : null;

  return (
    code === "23505" ||
    message?.includes("users_email_lower_unique_idx") ||
    message?.includes("duplicate key value violates unique constraint")
  );
};

const parseDurationToMs = (value: string) => {
  const match = value.trim().match(/^(\d+)([mhd])$/i);
  if (!match) {
    throw new Error(`Unsupported duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitMs =
    unit === "m"
      ? 60 * 1000
      : unit === "h"
        ? 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
  return amount * unitMs;
};

const getRefreshTokenTtlMs = () =>
  parseDurationToMs(
    process.env.REFRESH_TOKEN_TTL?.trim() || DEFAULT_REFRESH_TOKEN_TTL,
  );

const getAccessTokenTtlMs = () =>
  parseDurationToMs(
    process.env.ACCESS_TOKEN_TTL?.trim() || DEFAULT_ACCESS_TOKEN_TTL,
  );

const getPasswordHash = async (password: string) =>
  bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

const generateSignupOtp = () => `${randomInt(0, 1000000)}`.padStart(6, "0");

const sendSignupOtpEmail = async (email: string, code: string) => {
  await sendEmail(email, "Verify your CroudQ email", "signup-otp", {
    email,
    code,
  });
};

const verifyPassword = async (password: string, passwordHash: string) =>
  bcrypt.compare(password, passwordHash);

const issueAuthSession = async (
  user: {
    id: string;
    name: string | null;
    email: string;
  },
  metadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) => {
  const nextSession = buildAuthSessionArtifacts(user, metadata);

  await db.insert(authSessions).values(nextSession.sessionInsert);

  return {
    accessToken: nextSession.accessToken,
    refreshToken: nextSession.refreshToken,
    user: await toAuthUser(user),
  };
};

export const issueAuthSessionForUserId = async (
  userId: string,
  metadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
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

  return issueAuthSession(user, metadata);
};

const buildSessionSeed = (metadata?: {
  ipAddress?: string | null;
  userAgent?: string | null;
}) => {
  const refreshToken = randomBytes(48).toString("base64url");
  const sessionId = crypto.randomUUID();
  const now = new Date();

  return {
    sessionId,
    refreshToken,
    now,
    ipAddress: metadata?.ipAddress?.trim() || null,
    userAgent: metadata?.userAgent?.trim() || null,
  };
};

const buildAuthSessionArtifacts = (
  user: {
    id: string;
    name: string | null;
    email: string;
  },
  metadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) => {
  const seed = buildSessionSeed(metadata);

  return {
    sessionId: seed.sessionId,
    refreshToken: seed.refreshToken,
    accessToken: signJwt({ userId: user.id, sessionId: seed.sessionId }),
    sessionInsert: {
      id: seed.sessionId,
      userId: user.id,
      tokenHash: hashRefreshToken(seed.refreshToken),
      accessExpiresAt: new Date(seed.now.getTime() + getAccessTokenTtlMs()),
      expiresAt: new Date(seed.now.getTime() + getRefreshTokenTtlMs()),
      ipAddress: seed.ipAddress,
      userAgent: seed.userAgent,
      lastUsedAt: seed.now,
    },
  };
};

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

  const passwordHash = await getPasswordHash(input.password);
  const code = generateSignupOtp();
  const codeHash = hashSignupOtp(email, code);
  const now = new Date();

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

  await sendSignupOtpEmail(email, code);

  return {
    success: true as const,
    message: "We sent a 6-digit verification code to your email.",
  };
};

export const verifySignupOtp = async (
  input: {
    email: string;
    code: string;
  },
  metadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) => {
  const email = normalizeEmail(input.email);
  const code = input.code.trim();

  const signupOtp = await db.query.signupEmailOtps.findFirst({
    where: and(
      eq(signupEmailOtps.email, email),
      eq(signupEmailOtps.codeHash, hashSignupOtp(email, code)),
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

      const nextSession = buildAuthSessionArtifacts(createdUser, metadata);
      await tx.insert(authSessions).values(nextSession.sessionInsert);

      return {
        accessToken: nextSession.accessToken,
        refreshToken: nextSession.refreshToken,
        user: await toAuthUser(createdUser),
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

const findActiveAdminRecordByUserId = async (userId: string) => {
  return db.query.admins.findFirst({
    where: and(eq(admins.userId, userId), eq(admins.isActive, true)),
  });
};

export const loginWithEmail = async (
  input: {
    email: string;
    password: string;
  },
  metadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) => {
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

  const passwordMatches = await verifyPassword(
    input.password,
    credentials.passwordHash,
  );

  if (!passwordMatches) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
  }

  return issueAuthSession(user, metadata);
};

export const loginAdminWithEmail = async (
  input: {
    email: string;
    password: string;
  },
  metadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) => {
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

  const adminRecord = await findActiveAdminRecordByUserId(user.id);

  if (!adminRecord) {
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

  const passwordMatches = await verifyPassword(
    input.password,
    credentials.passwordHash,
  );

  if (!passwordMatches) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
  }

  return issueAuthSession(user, metadata);
};

export const getCurrentAuthUser = async (userId: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  return toAuthUser(user);
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

const getBackendPublicBaseUrl = (input: {
  host?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
}) => {
  const envBaseUrl = process.env.BACKEND_PUBLIC_URL?.trim();
  if (envBaseUrl) {
    return envBaseUrl.replace(/\/$/, "");
  }

  const host = input.forwardedHost?.trim() || input.host?.trim();
  if (!host) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Backend public URL is not configured",
    });
  }

  const proto =
    input.forwardedProto?.trim() ||
    (process.env.NODE_ENV === "production" ? "https" : "http");

  return `${proto}://${host}`;
};

export const createUpgradeLink = async (input: {
  userId: string;
  host?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
}) => {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, input.userId),
  });

  if (!existingUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  const rawToken = randomBytes(32).toString("hex");
  const now = new Date();

  await db.insert(webLoginTokens).values({
    userId: input.userId,
    tokenHash: hashWebLoginToken(rawToken),
    redirectPath: "/pricing",
    expiresAt: new Date(now.getTime() + WEB_LOGIN_TOKEN_TTL_MS),
  });

  const baseUrl = getBackendPublicBaseUrl(input);

  return {
    url: `${baseUrl}/api/auth/web/claim?token=${encodeURIComponent(rawToken)}`,
  };
};

export const claimWebLoginToken = async (
  token: string,
  metadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) => {
  const tokenHash = hashWebLoginToken(token);

  return db.transaction(async (tx) => {
    const now = new Date();
    const [claimedToken] = await tx
      .update(webLoginTokens)
      .set({
        usedAt: now,
      })
      .where(
        and(
          eq(webLoginTokens.tokenHash, tokenHash),
          isNull(webLoginTokens.usedAt),
          gt(webLoginTokens.expiresAt, now),
        ),
      )
      .returning({
        userId: webLoginTokens.userId,
        redirectPath: webLoginTokens.redirectPath,
      });

    if (!claimedToken) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Upgrade link is invalid or expired",
      });
    }

    const user = await tx.query.users.findFirst({
      where: eq(users.id, claimedToken.userId),
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Upgrade link is invalid or expired",
      });
    }

    const nextSession = buildAuthSessionArtifacts(user, metadata);
    await tx.insert(authSessions).values(nextSession.sessionInsert);

    return {
      session: {
        accessToken: nextSession.accessToken,
        refreshToken: nextSession.refreshToken,
      },
      redirectPath: claimedToken.redirectPath,
    };
  });
};

export const assertUserIsAdmin = async (userId: string) => {
  const adminRecord = await findActiveAdminRecordByUserId(userId);

  if (!adminRecord) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return adminRecord;
};

export const getCurrentAdminUser = async (userId: string) => {
  await assertUserIsAdmin(userId);
  return getCurrentAuthUser(userId);
};

export const createAdminByAdmin = async (
  creatorUserId: string,
  input: {
    email: string;
    password: string;
    name?: string | null;
  },
) => {
  const creatorAdmin = await assertUserIsAdmin(creatorUserId);
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

  const passwordHash = await getPasswordHash(input.password);
  const now = new Date();

  return db.transaction(async (tx) => {
    const [createdUser] = await tx
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email,
        name: input.name?.trim() || null,
        updatedAt: now,
      })
      .returning();

    await tx.insert(userCredentials).values({
      userId: createdUser.id,
      passwordHash,
      updatedAt: now,
    });

    await tx.insert(admins).values({
      userId: createdUser.id,
      createdByAdminId: creatorAdmin.id,
      isActive: true,
      updatedAt: now,
    });

    return toAuthUser(createdUser);
  });
};

export const updateProfileWithPassword = async (
  userId: string,
  input: {
    name: string;
    email: string;
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

  const passwordMatches = await verifyPassword(
    input.currentPassword,
    credentials.passwordHash,
  );

  if (!passwordMatches) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Current password is incorrect",
    });
  }

  const nextEmail = normalizeEmail(input.email);

  const existingUserWithEmail = await db.query.users.findFirst({
    where: eq(users.email, nextEmail),
  });

  if (existingUserWithEmail && existingUserWithEmail.id !== user.id) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "An account with this email already exists",
    });
  }

  try {
    const [updatedUser] = await db
      .update(users)
      .set({
        name: input.name.trim(),
        email: nextEmail,
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

export const refreshAuthSession = async (
  input: { refreshToken: string },
  metadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) => {
  const tokenHash = hashRefreshToken(input.refreshToken);

  return db.transaction(async (tx) => {
    const seed = buildSessionSeed(metadata);
    const existingSession = await tx.query.authSessions.findFirst({
      where: and(
        eq(authSessions.tokenHash, tokenHash),
        gt(authSessions.expiresAt, seed.now),
        isNull(authSessions.revokedAt),
      ),
    });

    if (!existingSession) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Refresh session is invalid or expired",
      });
    }

    if (existingSession.refreshRevokedAt) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Refresh session is invalid or expired",
      });
    }

    const user = await tx.query.users.findFirst({
      where: eq(users.id, existingSession.userId),
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Refresh session is invalid or expired",
      });
    }

    if (!existingSession.refreshRevokedAt) {
      const [consumedSession] = await tx
        .update(authSessions)
        .set({
          refreshRevokedAt: seed.now,
          lastUsedAt: seed.now,
        })
        .where(
          and(
            eq(authSessions.id, existingSession.id),
            isNull(authSessions.revokedAt),
            isNull(authSessions.refreshRevokedAt),
            gt(authSessions.expiresAt, seed.now),
          ),
        )
        .returning({
          id: authSessions.id,
        });

      if (!consumedSession) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Refresh session is invalid or expired",
        });
      }
    }

    await tx.insert(authSessions).values({
      id: seed.sessionId,
      userId: user.id,
      tokenHash: hashRefreshToken(seed.refreshToken),
      accessExpiresAt: new Date(seed.now.getTime() + getAccessTokenTtlMs()),
      expiresAt: new Date(seed.now.getTime() + getRefreshTokenTtlMs()),
      ipAddress: seed.ipAddress,
      userAgent: seed.userAgent,
      lastUsedAt: seed.now,
    });

    return {
      accessToken: signJwt({ userId: user.id, sessionId: seed.sessionId }),
      refreshToken: seed.refreshToken,
      user: await toAuthUser(user),
    };
  });
};

export const refreshAdminAuthSession = async (
  input: { refreshToken: string },
  metadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) => {
  const tokenHash = hashRefreshToken(input.refreshToken);

  return db.transaction(async (tx) => {
    const seed = buildSessionSeed(metadata);
    const existingSession = await tx.query.authSessions.findFirst({
      where: and(
        eq(authSessions.tokenHash, tokenHash),
        gt(authSessions.expiresAt, seed.now),
        isNull(authSessions.revokedAt),
      ),
    });

    if (!existingSession) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Refresh session is invalid or expired",
      });
    }

    if (existingSession.refreshRevokedAt) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Refresh session is invalid or expired",
      });
    }

    const activeAdmin = await tx.query.admins.findFirst({
      where: and(
        eq(admins.userId, existingSession.userId),
        eq(admins.isActive, true),
      ),
    });

    if (!activeAdmin) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Refresh session is invalid or expired",
      });
    }

    const user = await tx.query.users.findFirst({
      where: eq(users.id, existingSession.userId),
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Refresh session is invalid or expired",
      });
    }

    if (!existingSession.refreshRevokedAt) {
      const [consumedSession] = await tx
        .update(authSessions)
        .set({
          refreshRevokedAt: seed.now,
          lastUsedAt: seed.now,
        })
        .where(
          and(
            eq(authSessions.id, existingSession.id),
            isNull(authSessions.revokedAt),
            isNull(authSessions.refreshRevokedAt),
            gt(authSessions.expiresAt, seed.now),
          ),
        )
        .returning({
          id: authSessions.id,
        });

      if (!consumedSession) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Refresh session is invalid or expired",
        });
      }
    }

    await tx.insert(authSessions).values({
      id: seed.sessionId,
      userId: user.id,
      tokenHash: hashRefreshToken(seed.refreshToken),
      accessExpiresAt: new Date(seed.now.getTime() + getAccessTokenTtlMs()),
      expiresAt: new Date(seed.now.getTime() + getRefreshTokenTtlMs()),
      ipAddress: seed.ipAddress,
      userAgent: seed.userAgent,
      lastUsedAt: seed.now,
    });

    return {
      accessToken: signJwt({ userId: user.id, sessionId: seed.sessionId }),
      refreshToken: seed.refreshToken,
      user: await toAuthUser(user),
    };
  });
};

export const logoutSession = async (input: {
  accessToken: string | null;
  refreshToken: string | null;
}) => {
  const sessionIdsToRevoke = new Set<string>();

  if (input.refreshToken) {
    const tokenHash = hashRefreshToken(input.refreshToken);
    const refreshSession = await db.query.authSessions.findFirst({
      where: eq(authSessions.tokenHash, tokenHash),
    });
    if (refreshSession) {
      sessionIdsToRevoke.add(refreshSession.id);
    }
  }

  if (!input.accessToken) {
    if (sessionIdsToRevoke.size > 0) {
      await db
        .update(authSessions)
        .set({
          revokedAt: new Date(),
          lastUsedAt: new Date(),
        })
        .where(inArray(authSessions.id, Array.from(sessionIdsToRevoke)));
    }

    return {
      success: true as const,
      message: "Logged out successfully",
    };
  }

  const payload = verifyJwt(input.accessToken);
  if (!payload) {
    if (sessionIdsToRevoke.size > 0) {
      await db
        .update(authSessions)
        .set({
          revokedAt: new Date(),
          lastUsedAt: new Date(),
        })
        .where(inArray(authSessions.id, Array.from(sessionIdsToRevoke)));
    }

    return {
      success: true as const,
      message: "Logged out successfully",
    };
  }

  if (payload.sessionId) {
    sessionIdsToRevoke.add(payload.sessionId);
  }

  await db
    .insert(revokedTokens)
    .values({
      jti: payload.jti,
      expiresAt: new Date(payload.exp * 1000),
    })
    .onConflictDoNothing();

  if (sessionIdsToRevoke.size > 0) {
    await db
      .update(authSessions)
      .set({
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      })
      .where(inArray(authSessions.id, Array.from(sessionIdsToRevoke)));
  }

  return {
    success: true as const,
    message: "Logged out successfully",
  };
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
      success: true as const,
      message: "If an account exists, a reset link has been sent.",
    };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const resetLink = buildResetLink(rawToken, input.redirectTo ?? undefined);
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
    success: true as const,
    message: "If an account exists, a reset link has been sent.",
  };
};

export const requestAdminPasswordReset = async (input: {
  email: string;
  redirectTo?: string | null;
}) => {
  const email = normalizeEmail(input.email);
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return {
      success: true as const,
      message: "If an account exists, a reset link has been sent.",
    };
  }

  const adminRecord = await findActiveAdminRecordByUserId(user.id);
  if (!adminRecord) {
    return {
      success: true as const,
      message: "If an account exists, a reset link has been sent.",
    };
  }

  return requestPasswordReset(input);
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

  const passwordHash = await getPasswordHash(input.password);
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

  await db
    .update(authSessions)
    .set({
      revokedAt: now,
      lastUsedAt: now,
    })
    .where(eq(authSessions.userId, resetToken.userId));

  return {
    success: true as const,
    message: "Password updated successfully",
  };
};

export const resetAdminPassword = async (input: {
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

  await assertUserIsAdmin(resetToken.userId);

  return resetPassword(input);
};
