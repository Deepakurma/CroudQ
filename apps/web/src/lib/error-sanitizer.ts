const SENSITIVE_ERROR_PATTERNS = [
  'trpcclienterror',
  'internal_server_error',
  'msg91',
  'ipblocked',
  'error code',
  'code:'
];

export const getRawErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message.trim() : '';

export const hasSensitiveErrorContent = (message: string) => {
  const lower = message.toLowerCase();
  return SENSITIVE_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
};
