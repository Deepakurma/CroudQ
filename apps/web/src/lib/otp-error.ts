import { getRawErrorMessage, hasSensitiveErrorContent } from './error-sanitizer';

export const OTP_VERIFY_ATTEMPTS_EXCEEDED_MESSAGE =
  'Verification attempt limit reached. Please request a new OTP.';

const OTP_ALLOWED_MESSAGES = [
  'Please wait 20 seconds before resending OTP.',
  'OTP send limit reached for 10 minutes. Please try again later.',
  OTP_VERIFY_ATTEMPTS_EXCEEDED_MESSAGE,
  'OTP session expired. Please resend OTP.',
  'OTP session expired. Please request OTP again.',
  'Invalid OTP. Please try again.',
  'This account is not eligible for vendor account access. Use tenant account access.',
  'This account is not eligible for tenant account access.'
];

export const getPublicOtpErrorMessage = (error: unknown, fallback: string) => {
  const message = getRawErrorMessage(error);
  if (!message || hasSensitiveErrorContent(message)) return fallback;

  if (OTP_ALLOWED_MESSAGES.includes(message)) {
    return message;
  }

  return fallback;
};

export const isOtpVerifyAttemptsExceededError = (error: unknown) => {
  const message = getRawErrorMessage(error);
  return message === OTP_VERIFY_ATTEMPTS_EXCEEDED_MESSAGE;
};
