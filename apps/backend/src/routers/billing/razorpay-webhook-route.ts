import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TRPCError } from "@trpc/server";

import { processRazorpayWebhook } from "../../modules/billing/controller";

export async function registerRazorpayWebhookRoute(server: FastifyInstance) {
  await server.register(async (instance) => {
    instance.addContentTypeParser(
      "application/json",
      { parseAs: "string" },
      (_request, body, done) => {
        done(null, body);
      },
    );

    instance.post(
      "/api/billing/razorpay/webhook",
      async (
        request: FastifyRequest<{ Body: string }>,
        reply: FastifyReply,
      ) => {
        const signatureHeader = request.headers["x-razorpay-signature"];
        const signature =
          typeof signatureHeader === "string" ? signatureHeader.trim() : "";

        if (!signature) {
          return reply.code(400).send({ ok: false, message: "Missing signature" });
        }

        try {
          await processRazorpayWebhook(request.body, signature);
          return reply.code(200).send({ ok: true });
        } catch (error) {
          request.log.error({ error }, "Failed to process Razorpay webhook");
          if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
            return reply.code(401).send({ ok: false, message: error.message });
          }

          return reply.code(500).send({ ok: false, message: "Webhook processing failed" });
        }
      },
    );
  });
}
