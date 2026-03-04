import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  otpRates,
  properties,
  residents,
  superAdmins,
  users,
} from "../db/schema";
import { signJwt } from "../utils/jwt";
import { normalizeIndianPhone } from "../utils/phone";

const OTP_RESEND_COOLDOWN_SECONDS = 20;
const OTP_WINDOW_MINUTES = 10;
const MAX_OTP_SENDS_PER_WINDOW = 3;
const MAX_OTP_VERIFY_ATTEMPTS = 3;
const OTP_VERIFY_ATTEMPTS_EXCEEDED_MESSAGE =
  "Verification attempt limit reached. Please request a new OTP.";
const MSG91_VERIFY_ATTEMPT_LIMIT_CODES = new Set(["704"]);

export type UserRole = "VENDOR" | "RESIDENT" | "SUPER_ADMIN";

export interface IdentityResolution {
  userId: string;
  roles: UserRole[];
  needsOnboarding: boolean;
}

export interface VerifyOtpResult {
  token: string;
  user: typeof users.$inferSelect;
  identity: IdentityResolution;
}

const resolveIdentity = async (userId: string): Promise<IdentityResolution> => {
  const [superAdminAccount, vendorProperty, activeResident] = await Promise.all(
    [
      db.query.superAdmins.findFirst({
        columns: { id: true },
        where: eq(superAdmins.userId, userId),
      }),
      db.query.properties.findFirst({
        columns: { id: true },
        where: eq(properties.userId, userId),
      }),
      db.query.residents.findFirst({
        columns: { id: true },
        where: and(
          eq(residents.userId, userId),
          eq(residents.active, true),
          eq(residents.status, "active"),
        ),
      }),
    ],
  );
  const isSuperAdmin = Boolean(superAdminAccount);

  if (vendorProperty && activeResident) {
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "Account role conflict: this account is linked to both vendor and resident profiles. Contact support.",
    });
  }

  const roles: UserRole[] = [];
  if (isSuperAdmin) {
    roles.push("SUPER_ADMIN");
  }
  if (vendorProperty) {
    roles.push("VENDOR");
  } else if (activeResident) {
    roles.push("RESIDENT");
  }

  return {
    userId,
    roles,
    needsOnboarding: roles.length === 0,
  };
};

const ensureUserByPhone = async (
  phoneNumber: string,
): Promise<typeof users.$inferSelect> => {
  let existing = await db.query.users.findFirst({
    where: eq(users.phoneNumber, phoneNumber),
  });

  // Backward-compatible lookup for legacy records like +91xxxxxxxxxx / formatted values.
  if (!existing) {
    const [normalizedMatch] = await db
      .select()
      .from(users)
      .where(
        sql`right(regexp_replace(coalesce(${users.phoneNumber}, ''), '\D', '', 'g'), 10) = ${phoneNumber}`,
      )
      .limit(1);
    if (normalizedMatch) {
      existing = normalizedMatch;
      if (existing.phoneNumber !== phoneNumber) {
        await db
          .update(users)
          .set({
            phoneNumber,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing.id));
      }
    }
  }

  if (existing) {
    return existing;
  }

  const userId = crypto.randomUUID();
  const [created] = await db
    .insert(users)
    .values({
      id: userId,
      phoneNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
};

type Msg91WidgetConfig = {
  widgetId: string;
  tokenAuth: string;
};

type Msg91Payload = {
  type?: string;
  message?: string;
  code?: string | number;
  error?: string;
  errorCode?: string | number;
  reqId?: string;
  requestId?: string;
  request_id?: string;
};

const getWidgetConfig = (): Msg91WidgetConfig | null => {
  const widgetId = process.env.MSG91_WIDGET_ID;
  const tokenAuth = process.env.MSG91_WIDGET_TOKEN_AUTH;
  if (!widgetId || !tokenAuth) return null;
  return { widgetId, tokenAuth };
};

const requireWidgetConfig = (): Msg91WidgetConfig => {
  const config = getWidgetConfig();
  if (!config) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to process OTP right now. Please try again.",
    });
  }
  return config;
};

type OtpFlow = "send" | "retry" | "verify";

const extractProviderErrorDetails = (
  payload: Msg91Payload | null | undefined,
) => ({
  message:
    typeof payload?.message === "string"
      ? payload.message
      : payload?.error || null,
  code: payload?.code || payload?.errorCode || null,
});

const getProviderErrorCode = (
  payload: Msg91Payload | null | undefined,
): string | null => {
  const rawCode = payload?.code ?? payload?.errorCode;
  if (rawCode === null || rawCode === undefined) return null;
  const parsed = String(rawCode).trim();
  return parsed.length > 0 ? parsed : null;
};

const logMsg91ProviderError = (
  flow: OtpFlow,
  payload: Msg91Payload | null | undefined,
) => {
  const details = extractProviderErrorDetails(payload);
  console.error(`[auth.${flow}OTP] MSG91 provider error`, {
    type: payload?.type || null,
    message: details.message,
    code: details.code,
  });
};

const getPublicOtpErrorMessage = (
  flow: OtpFlow,
  payload: Msg91Payload | null | undefined,
) => {
  const details = extractProviderErrorDetails(payload);
  const providerMessage = String(details.message || "").toLowerCase();

  if (flow === "verify") {
    if (isVerifyAttemptsExhaustedProviderError(payload)) {
      return OTP_VERIFY_ATTEMPTS_EXCEEDED_MESSAGE;
    }

    if (providerMessage.includes("expired")) {
      return "OTP session expired. Please resend OTP.";
    }

    if (
      providerMessage.includes("invalid") ||
      providerMessage.includes("incorrect")
    ) {
      return "Invalid OTP. Please try again.";
    }

    return "Unable to verify OTP right now. Please try again.";
  }

  if (flow === "retry") {
    return "Unable to resend OTP right now. Please try again.";
  }

  return "Unable to send OTP right now. Please try again.";
};

const isVerifyAttemptsExhaustedProviderError = (
  payload: Msg91Payload | null | undefined,
) => {
  const providerCode = getProviderErrorCode(payload);
  if (providerCode && MSG91_VERIFY_ATTEMPT_LIMIT_CODES.has(providerCode)) {
    return true;
  }

  const details = extractProviderErrorDetails(payload);
  const providerMessage = String(details.message || "").toLowerCase();
  return providerMessage.includes("verification limit exceeded");
};

const isInvalidOtpProviderError = (
  payload: Msg91Payload | null | undefined,
) => {
  const details = extractProviderErrorDetails(payload);
  const providerMessage = String(details.message || "").toLowerCase();
  return (
    providerMessage.includes("invalid") ||
    providerMessage.includes("incorrect")
  );
};

const shouldIncrementVerifyAttempts = (
  payload: Msg91Payload | null | undefined,
) => {
  if (isVerifyAttemptsExhaustedProviderError(payload)) return false;

  const details = extractProviderErrorDetails(payload);
  const providerMessage = String(details.message || "").toLowerCase();
  if (providerMessage.includes("expired")) return false;
  if (isInvalidOtpProviderError(payload)) return true;

  // If MSG91 changes text but still sends an error code, count it as a failed verify.
  return getProviderErrorCode(payload) !== null;
};

const extractReqId = (
  payload: Msg91Payload | null | undefined,
): string | null => {
  const raw = payload?.reqId || payload?.requestId || payload?.request_id;
  if (!raw) return null;
  const value = String(raw).trim();
  return value.length > 0 ? value : null;
};

const extractWidgetReqIdFromMessage = (
  payload: Msg91Payload | null | undefined,
): string | null => {
  if (!payload || payload.type !== "success") return null;
  const message =
    typeof payload.message === "string" ? payload.message.trim() : "";
  if (!message) return null;
  // For widget APIs some accounts return request-id in "message".
  // Use it as-is; decoding can break verify lookups.
  return message;
};

const withPhoneOtpLock = async <T>(
  phoneNumber: string,
  fn: () => Promise<T>,
): Promise<T> => {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${phoneNumber}))`);
    return fn();
  });
};

const assertOtpSendAllowed = async (phoneNumber: string) => {
  const now = new Date();
  const tenMinutesAgo = new Date(
    now.getTime() - OTP_WINDOW_MINUTES * 60 * 1000,
  );
  const twentySecondsAgo = new Date(
    now.getTime() - OTP_RESEND_COOLDOWN_SECONDS * 1000,
  );

  const rateData = await db.query.otpRates.findFirst({
    where: eq(otpRates.phoneNumber, phoneNumber),
  });

  if (!rateData) return;

  if (rateData.lastSentAt && rateData.lastSentAt > twentySecondsAgo) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Please wait 20 seconds before resending OTP.",
    });
  }

  if (rateData.firstSendAt && rateData.firstSendAt > tenMinutesAgo) {
    const currentCount = rateData.sendCount || 0;
    if (currentCount >= MAX_OTP_SENDS_PER_WINDOW) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "OTP send limit reached for 10 minutes. Please try again later.",
        });
      }
  }
};

const recordSuccessfulOtpSend = async (phoneNumber: string) => {
  const now = new Date();
  const tenMinutesAgo = new Date(
    now.getTime() - OTP_WINDOW_MINUTES * 60 * 1000,
  );

  await db.transaction(async (tx) => {
    const rateData = await tx.query.otpRates.findFirst({
      where: eq(otpRates.phoneNumber, phoneNumber),
    });

    if (!rateData) {
      await tx.insert(otpRates).values({
        phoneNumber,
        lastSentAt: now,
        firstSendAt: now,
        sendCount: 1,
        attempts: 0,
      });
      return;
    }

    if (rateData.firstSendAt && rateData.firstSendAt > tenMinutesAgo) {
      await tx
        .update(otpRates)
        .set({
          sendCount: (rateData.sendCount || 0) + 1,
          lastSentAt: now,
          attempts: 0,
          updatedAt: now,
        })
        .where(eq(otpRates.phoneNumber, phoneNumber));
      return;
    }

    await tx
      .update(otpRates)
      .set({
        sendCount: 1,
        firstSendAt: now,
        lastSentAt: now,
        attempts: 0,
        updatedAt: now,
      })
      .where(eq(otpRates.phoneNumber, phoneNumber));
  });
};

export const authService = {
  resolveIdentity,
  async sendOTP(rawPhoneNumber: string) {
    const phoneNumber = normalizeIndianPhone(rawPhoneNumber);
    return withPhoneOtpLock(phoneNumber, async () => {
      await assertOtpSendAllowed(phoneNumber);

      try {
        const widgetConfig = requireWidgetConfig();
        const data: Msg91Payload = await fetch(
          "https://control.msg91.com/api/v5/widget/sendOtpMobile",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              widgetId: widgetConfig.widgetId,
              tokenAuth: widgetConfig.tokenAuth,
              identifier: `91${phoneNumber}`,
            }),
          },
        ).then((response) => response.json() as Promise<Msg91Payload>);

        if (data.type === "error") {
          logMsg91ProviderError("send", data);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: getPublicOtpErrorMessage("send", data),
          });
        }

        const resolvedReqId =
          extractReqId(data) || extractWidgetReqIdFromMessage(data);
        if (!resolvedReqId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to send OTP right now. Please try again.",
          });
        }

        await recordSuccessfulOtpSend(phoneNumber);
        return {
          success: true,
          message: "OTP sent successfully",
          reqId: resolvedReqId,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("MSG91 Send Proxy Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send OTP. Please try again later.",
        });
      }
    });
  },

  async retryOTP(input: {
    phoneNumber: string;
    reqId: string;
    retryChannel?: 4 | 11;
  }) {
    const phoneNumber = normalizeIndianPhone(input.phoneNumber);
    const reqId = input.reqId.trim();
    const retryChannel = input.retryChannel;
    return withPhoneOtpLock(phoneNumber, async () => {
      await assertOtpSendAllowed(phoneNumber);

      try {
        const widgetConfig = requireWidgetConfig();
        const data: Msg91Payload = await fetch(
          "https://control.msg91.com/api/v5/widget/retryOtp",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              widgetId: widgetConfig.widgetId,
              tokenAuth: widgetConfig.tokenAuth,
              reqId,
              ...(retryChannel ? { retryChannel } : {}),
            }),
          },
        ).then((response) => response.json() as Promise<Msg91Payload>);

        if (data.type === "error") {
          logMsg91ProviderError("retry", data);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: getPublicOtpErrorMessage("retry", data),
          });
        }

        await recordSuccessfulOtpSend(phoneNumber);

        return {
          success: true,
          message: "OTP resent successfully",
          reqId: extractReqId(data) || reqId || null,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to resend OTP. Please try again later.",
        });
      }
    });
  },

  async verifyOTP(
    rawPhoneNumber: string,
    otp: string,
    reqId: string,
  ): Promise<VerifyOtpResult> {
    const phoneNumber = normalizeIndianPhone(rawPhoneNumber);
    const normalizedReqId = reqId.trim();
    if (!normalizedReqId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "OTP session expired. Please request OTP again.",
      });
    }
    return withPhoneOtpLock(phoneNumber, async () => {
      const now = new Date();
      const widgetConfig = requireWidgetConfig();
      const rateData = await db.query.otpRates.findFirst({
        where: eq(otpRates.phoneNumber, phoneNumber),
      });

      if (rateData && (rateData.attempts || 0) >= MAX_OTP_VERIFY_ATTEMPTS) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: OTP_VERIFY_ATTEMPTS_EXCEEDED_MESSAGE,
        });
      }

      try {
        const data: Msg91Payload = await fetch(
          "https://control.msg91.com/api/v5/widget/verifyOtp",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              widgetId: widgetConfig.widgetId,
              tokenAuth: widgetConfig.tokenAuth,
              reqId: normalizedReqId,
              otp,
            }),
          },
        ).then((response) => response.json() as Promise<Msg91Payload>);

        if (data.type === "error") {
          logMsg91ProviderError("verify", data);

          if (isVerifyAttemptsExhaustedProviderError(data)) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: OTP_VERIFY_ATTEMPTS_EXCEEDED_MESSAGE,
            });
          }

          if (rateData && shouldIncrementVerifyAttempts(data)) {
            await db
              .update(otpRates)
              .set({
                attempts: sql`coalesce(${otpRates.attempts}, 0) + 1`,
                updatedAt: now,
              })
              .where(eq(otpRates.phoneNumber, phoneNumber));
          } else if (!rateData && shouldIncrementVerifyAttempts(data)) {
            await db
              .insert(otpRates)
              .values({
                phoneNumber,
                attempts: 1,
                sendCount: 0,
                firstSendAt: now,
                lastSentAt: now,
              })
              .onConflictDoUpdate({
                target: otpRates.phoneNumber,
                set: {
                  attempts: 1,
                  updatedAt: now,
                },
              });
          }
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: getPublicOtpErrorMessage("verify", data),
          });
        }

        if (rateData) {
          await db.delete(otpRates).where(eq(otpRates.phoneNumber, phoneNumber));
        }

        const user = await ensureUserByPhone(phoneNumber);
        const identity = await resolveIdentity(user.id);
        const token = signJwt({ userId: user.id });

        return {
          token,
          user,
          identity,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("MSG91 Verify Proxy Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify OTP. Please try again later.",
        });
      }
    });
  },
};
