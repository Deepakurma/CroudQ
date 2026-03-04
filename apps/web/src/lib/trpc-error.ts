import { getRawErrorMessage, hasSensitiveErrorContent } from './error-sanitizer';

export const getPublicErrorMessage = (
  error: unknown,
  fallback: string,
  allowedMessages: string[] = []
) => {
  const message = getRawErrorMessage(error);
  if (!message || hasSensitiveErrorContent(message)) {
    return fallback;
  }

  if (allowedMessages.includes(message)) {
    return message;
  }

  return fallback;
};
