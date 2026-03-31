import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { claimWebLoginToken } from "../../modules/auth/controller";
import { setWebAuthCookies } from "../../modules/web-auth/controller";

const getFrontendPricingUrl = (path: string) => {
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  if (!frontendUrl) {
    return null;
  }

  return new URL(path, frontendUrl).toString();
};

export async function registerWebClaimRoute(server: FastifyInstance) {
  server.get(
    "/api/auth/web/claim",
    async (
      request: FastifyRequest<{ Querystring: { token?: string } }>,
      reply: FastifyReply,
    ) => {
      const token = request.query.token?.trim();
      const fallbackRedirect = getFrontendPricingUrl("/pricing") ?? "/";

      if (!token) {
        return reply.redirect(`${fallbackRedirect}?error=invalid-upgrade-link`);
      }

      try {
        const claimed = await claimWebLoginToken(token, {
          ipAddress: request.ip,
          userAgent:
            typeof request.headers["user-agent"] === "string"
              ? request.headers["user-agent"]
              : null,
        });

        setWebAuthCookies(reply, claimed.session);

        const redirectUrl =
          getFrontendPricingUrl(claimed.redirectPath) ?? fallbackRedirect;
        return reply.redirect(redirectUrl);
      } catch {
        return reply.redirect(`${fallbackRedirect}?error=invalid-upgrade-link`);
      }
    },
  );
}
