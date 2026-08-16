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
import {
  createOAuthState,
  consumeOAuthState,
} from "../../modules/oauth-state/controller";
import {
  disconnectYoutubeAccount,
  ensureSyncCooldown,
  getStoredYoutubeData,
  syncYoutubeAccount,
  ensureUserExists,
} from "../../modules/youtube-sync/controller";
import {
  COMMENTS_SYNC_VIDEO_LIMIT,
  SYNC_COOLDOWN_MS,
  SYNC_VIDEO_METRICS_FETCH_LIMIT,
  COMMENTS_LIMIT,
} from "../../modules/youtube-sync/constants";
import { getStoredInsightState } from "../../modules/insights/controller";
import { createTRPCRouter, protectedProcedure } from "../../server/trpc";
import { encryptSecret } from "../../utils/secrets";
import {
  youtubeAuthUrlQuerySchema,
  youtubeCallbackQuerySchema,
  youtubeDataParamsSchema,
  youtubeSyncParamsSchema,
} from "./dto";

const getFrontendRedirectUrl = (pathAndQuery: string) => {
  const baseUrl = process.env.FRONTEND_URL;
  if (!baseUrl) return null;

  return new URL(pathAndQuery, baseUrl).toString();
};

const sendYoutubeError = (
  reply: FastifyReply,
  redirectTo: string | undefined,
  error: unknown,
) => {
  const mapped = mapYoutubeError(error);
  const separator = redirectTo && redirectTo.includes("?") ? "&" : "?";

  if (redirectTo) {
    return reply.redirect(
      `${redirectTo}${separator}provider=youtube&status=error&message=${encodeURIComponent(mapped.message)}`,
    );
  }

  return reply.code(mapped.statusCode).send({
    error: mapped.message,
  });
};

// OuthState Creation
export const youtubeRouter = createTRPCRouter({
  OAuthUrl: protectedProcedure
    .input(youtubeAuthUrlQuerySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const stateToken = await createOAuthState({
          provider: "youtube",
          userId: ctx.user.userId,
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
    .query(async ({ ctx, input }) => {
      try {
        return await getStoredYoutubeData({
          userId: ctx.user.userId,
          cursor: input.cursor,
          limit: input.limit,
        });
      } catch (error) {
        console.error(error);
        throw toYoutubeTRPCError(error);
      }
    }),

  sync: protectedProcedure
    .input(youtubeSyncParamsSchema)
    .mutation(async ({ ctx }) => {
      try {
        await ensureSyncCooldown({
          userId: ctx.user.userId,
          syncCooldownMs: SYNC_COOLDOWN_MS,
        });
        const payload = await syncYoutubeAccount({
          userId: ctx.user.userId,
          maxVideoResults: SYNC_VIDEO_METRICS_FETCH_LIMIT,
          commentSyncVideoLimit: COMMENTS_SYNC_VIDEO_LIMIT,
          commentsPerVideo: COMMENTS_LIMIT,
        });

        // Lets ai insights run in the background while the youtube sync finishes
        void getStoredInsightState({
          userId: ctx.user.userId,
          forceRefresh: true,
        }).catch(() => {
          // Keep YouTube sync successful even if the AI refresh fails.
        });

        return payload;
      } catch (error) {
        throw toYoutubeTRPCError(error);
      }
    }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await disconnectYoutubeAccount(ctx.user.userId);

      return {
        success: true,
        message: "YouTube account disconnected.",
      };
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
      let redirectTo = getFrontendRedirectUrl("/dashboard") || undefined;

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
        redirectTo = oauthState.redirectTo ?? redirectTo;
        await ensureUserExists(oauthState.userId);

        const tokens = await exchangeCodeForTokens(code);
        const expiresAt = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null;
        const now = new Date();
        const accessToken = encryptSecret(tokens.access_token!);
        const refreshToken = tokens.refresh_token
          ? encryptSecret(tokens.refresh_token)
          : null;

        await db
          .insert(youtubeAccounts)
          .values({
            userId: oauthState.userId,
            channelId: "pending",
            channelName: null,
            accessToken,
            refreshToken,
            expiresAt,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: youtubeAccounts.userId,
            set: {
              accessToken,
              refreshToken: refreshToken ?? youtubeAccounts.refreshToken,
              expiresAt,
              updatedAt: now,
            },
          });

        const payload = await syncYoutubeAccount({
          userId: oauthState.userId,
          maxVideoResults: SYNC_VIDEO_METRICS_FETCH_LIMIT,
          commentSyncVideoLimit: COMMENTS_SYNC_VIDEO_LIMIT,
          commentsPerVideo: COMMENTS_LIMIT,
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
