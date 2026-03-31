import { TRPCError } from "@trpc/server";

export class YoutubeRouteError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "YoutubeRouteError";
    this.statusCode = statusCode;
  }
}

export const mapYoutubeError = (error: unknown) => {
  if (error instanceof YoutubeRouteError) {
    const trpcCode =
      error.statusCode === 404
        ? "NOT_FOUND"
        : error.statusCode === 429
          ? "TOO_MANY_REQUESTS"
          : error.statusCode >= 500
            ? "INTERNAL_SERVER_ERROR"
            : "BAD_REQUEST";

    return {
      message: error.message,
      statusCode: error.statusCode,
      trpcCode,
    } as const;
  }

  if (error instanceof Error) {
    if (
      error.message.includes("invalid_grant") ||
      error.message.toLowerCase().includes("token") ||
      error.message.toLowerCase().includes("oauth")
    ) {
      return {
        message: "Could not connect your YouTube account",
        statusCode: 400,
        trpcCode: "BAD_REQUEST",
      } as const;
    }

    if (
      error.message.includes("403") ||
      error.message.includes("quota") ||
      error.message.includes("PERMISSION_DENIED")
    ) {
      return {
        message: "Could not sync YouTube data right now",
        statusCode: 403,
        trpcCode: "FORBIDDEN",
      } as const;
    }
  }

  return {
    message: "Something went wrong. Please try again.",
    statusCode: 500,
    trpcCode: "INTERNAL_SERVER_ERROR",
  } as const;
};

export const toYoutubeTRPCError = (error: unknown) => {
  if (error instanceof TRPCError) {
    return error;
  }

  const mapped = mapYoutubeError(error);

  return new TRPCError({
    code: mapped.trpcCode,
    message: mapped.message,
  });
};
