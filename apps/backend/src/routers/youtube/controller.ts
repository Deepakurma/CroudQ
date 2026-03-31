import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { db } from "../../db";
import { youtubeAccounts } from "../../db/schema";
import {
  mapYoutubeError,
  toYoutubeTRPCError,
  YoutubeRouteError,
} from "../../modules/youtube-errors/controller";
import {
  buildYoutubeOAuthUrl,
  exchangeCodeForTokens,
} from "../../modules/youtube-oauth/controller";
import { createOAuthState, consumeOAuthState } from "../../modules/oauth-state/controller";
import {
  ensureSyncCooldown,
  getStoredYoutubeData,
  syncYoutubeAccount,
  ensureUserExists,
} from "../../modules/youtube-sync/controller";
import {
  COMMENTS_PER_VIDEO,
  SYNC_COOLDOWN_MS,
  SYNC_VIDEO_FETCH_LIMIT,
} from "../../modules/youtube-sync/constants";
import { refreshYoutubeInsightsForUser } from "../../modules/insights/controller";
import {
  createTRPCRouter,
  protectedProcedure,
} from "../../server/trpc";
import {
  youtubeAuthUrlQuerySchema,
  youtubeCallbackQuerySchema,
  youtubeDataParamsSchema,
  youtubeSyncParamsSchema,
} from "./dto";
import { encryptSecret } from "../../utils/secrets";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

const getFrontendRedirectUrl = (pathAndQuery: string) => {
  const baseUrl = process.env.FRONTEND_URL;
  if (!baseUrl) return null;

  return new URL(pathAndQuery, baseUrl).toString();
};

const fetchAuthorizedJson = async <T>(
  url: string,
  accessToken: string,
): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `YouTube API request failed (${response.status}): ${message || "Unknown error"}`,
    );
  }

  return (await response.json()) as T;
};

const fetchYoutubeJson = async <T>(
  path: string,
  accessToken: string,
): Promise<T> =>
  fetchAuthorizedJson<T>(`${YOUTUBE_API_BASE_URL}${path}`, accessToken);

const sendYoutubeError = (
  reply: FastifyReply,
  redirectTo: string | undefined,
  error: unknown,
) => {
  const mapped = mapYoutubeError(error);

  if (redirectTo) {
    return reply.redirect(
      `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}provider=youtube&status=error&message=${encodeURIComponent(mapped.message)}`,
    );
  }

  return reply.code(mapped.statusCode).send({
    error: mapped.message,
  });
};

export const youtubeRouter = createTRPCRouter({
  authUrl: protectedProcedure
    .input(youtubeAuthUrlQuerySchema)
    .query(async ({ ctx, input }) => {
      try {
        const stateToken = await createOAuthState({
          provider: "youtube",
          userId: ctx.user.id,
          redirectTo: input.redirectTo,
        });

        return {
          url: buildYoutubeOAuthUrl(stateToken),
        };
      } catch (error) {
        throw toYoutubeTRPCError(error);
      }
    }),
  data: protectedProcedure
    .input(youtubeDataParamsSchema)
    .query(async ({ ctx }) => {
      try {
        return await getStoredYoutubeData({
          userId: ctx.user.id,
        });
      } catch (error) {
        throw toYoutubeTRPCError(error);
      }
    }),
  sync: protectedProcedure
    .input(youtubeSyncParamsSchema)
    .mutation(async ({ ctx }) => {
      try {
        await ensureSyncCooldown({
          userId: ctx.user.id,
          syncCooldownMs: SYNC_COOLDOWN_MS,
        });
        const payload = await syncYoutubeAccount({
          userId: ctx.user.id,
          maxVideoResults: SYNC_VIDEO_FETCH_LIMIT,
          commentsPerVideo: COMMENTS_PER_VIDEO,
          fetchAuthorizedJson,
          fetchYoutubeJson,
        });

        void refreshYoutubeInsightsForUser({
          userId: ctx.user.id,
        }).catch(() => {
          // Keep YouTube sync successful even if the AI refresh fails.
        });

        return payload;
      } catch (error) {
        throw toYoutubeTRPCError(error);
      }
    }),
});

export async function registerYoutubeCallbackRoute(server: FastifyInstance) {
  server.get(
    "/api/auth/youtube/callback",
    async (request: FastifyRequest, reply) => {
      const parsedQuery = youtubeCallbackQuerySchema.safeParse(request.query);

      if (!parsedQuery.success) {
        return sendYoutubeError(
          reply,
          undefined,
          new YoutubeRouteError(
            parsedQuery.error.issues[0]?.message || "Invalid request",
            400,
          ),
        );
      }

      const { code, state, error } = parsedQuery.data;
      let redirectTo = getFrontendRedirectUrl("/connect-account") || undefined;

      if (error) {
        return sendYoutubeError(
          reply,
          redirectTo,
          new YoutubeRouteError(error, 400),
        );
      }

      if (!code || !state) {
        return sendYoutubeError(
          reply,
          redirectTo,
          new YoutubeRouteError("Could not complete YouTube connection", 400),
        );
      }

      try {
        const oauthState = await consumeOAuthState({
          provider: "youtube",
          token: state,
        });
        redirectTo = oauthState.redirectTo || redirectTo;
        await ensureUserExists(oauthState.userId);

        const tokens = await exchangeCodeForTokens(code);
        const expiresAt = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null;

        await db
          .insert(youtubeAccounts)
          .values({
            userId: oauthState.userId,
            channelId: "pending",
            channelName: null,
            accessToken: encryptSecret(
              tokens.access_token!,
              "YOUTUBE_TOKEN_ENCRYPTION_KEY",
            ),
            refreshToken: tokens.refresh_token
              ? encryptSecret(
                  tokens.refresh_token,
                  "YOUTUBE_TOKEN_ENCRYPTION_KEY",
                )
              : null,
            expiresAt,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: youtubeAccounts.userId,
            set: {
              accessToken: encryptSecret(
                tokens.access_token!,
                "YOUTUBE_TOKEN_ENCRYPTION_KEY",
              ),
              refreshToken:
                tokens.refresh_token
                  ? encryptSecret(
                      tokens.refresh_token,
                      "YOUTUBE_TOKEN_ENCRYPTION_KEY",
                    )
                  : youtubeAccounts.refreshToken,
              expiresAt,
              updatedAt: new Date(),
            },
          });

        const payload = await syncYoutubeAccount({
          userId: oauthState.userId,
          maxVideoResults: SYNC_VIDEO_FETCH_LIMIT,
          commentsPerVideo: COMMENTS_PER_VIDEO,
          fetchAuthorizedJson,
          fetchYoutubeJson,
        });

        if (redirectTo) {
          return reply.redirect(
            `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}provider=youtube&status=success&channelId=${encodeURIComponent(payload.channel.id)}`,
          );
        }

        return reply.send({
          success: true,
          data: payload,
        });
      } catch (callbackError) {
        server.log.error(
          { error: callbackError },
          "YouTube OAuth callback failed",
        );
        return sendYoutubeError(reply, redirectTo, callbackError);
      }
    },
  );
}
