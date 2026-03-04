export type OtpFlow = "send" | "retry" | "verify";
export const OTP_VERIFY_ATTEMPTS_EXCEEDED_MESSAGE =
  "Verification attempt limit reached. Please request a new OTP.";

const OTP_ALLOWED_MESSAGES = [
  "Please wait 20 seconds before resending OTP.",
  "OTP send limit reached for 10 minutes. Please try again later.",
  OTP_VERIFY_ATTEMPTS_EXCEEDED_MESSAGE,
  "OTP session expired. Please resend OTP.",
  "OTP session expired. Please request OTP again.",
  "Invalid OTP. Please try again.",
  "This account is not eligible for vendor account access. Use tenant account access.",
  "This account is not eligible for tenant account access.",
];

const SENSITIVE_PATTERNS = ["trpcclienterror", "msg91", "error code", "code:"];

const getRawMessage = (error: unknown) =>
  error instanceof Error ? error.message.trim() : "";

const hasSensitiveContent = (message: string) => {
  const lower = message.toLowerCase();
  return SENSITIVE_PATTERNS.some((pattern) => lower.includes(pattern));
};

const getOtpFallbackMessage = (flow: OtpFlow) => {
  if (flow === "verify") {
    return "Could not verify OTP right now. Please try again.";
  }
  if (flow === "retry") {
    return "Could not resend OTP right now. Please try again.";
  }
  return "Could not send OTP right now. Please try again.";
};

export const getOtpErrorMessage = (error: unknown, flow: OtpFlow) => {
  const message = getRawMessage(error);
  if (!message || hasSensitiveContent(message)) {
    return getOtpFallbackMessage(flow);
  }

  const lower = message.toLowerCase();
  if (
    lower.includes("already a vendor") ||
    lower.includes("already an active resident") ||
    lower.includes("role conflict") ||
    lower.includes("linked to both vendor and resident")
  ) {
    return "This phone number is already linked to a different account type. Please use a different number or contact support.";
  }

  if (OTP_ALLOWED_MESSAGES.includes(message)) {
    return message;
  }

  return getOtpFallbackMessage(flow);
};

export const getTrpcErrorLogMessage = (error: unknown) => {
  const message = getRawMessage(error);
  return message || "Unknown error";
};

export const isOtpVerifyAttemptsExceededError = (error: unknown) => {
  const message = getRawMessage(error);
  return message === OTP_VERIFY_ATTEMPTS_EXCEEDED_MESSAGE;
};
