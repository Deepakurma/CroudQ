import {
  createCheckoutSession,
  getBillingPlansOverview,
  verifyCheckoutSignature,
} from "../../modules/billing/controller";
import { createTRPCRouter, protectedProcedure } from "../../server/trpc";
import {
  billingOverviewSchema,
  createCheckoutSessionInputSchema,
  createCheckoutSessionSchema,
  verifyCheckoutInputSchema,
  verifyCheckoutSchema,
} from "./dto";

export const billingRouter = createTRPCRouter({
  overview: protectedProcedure.query(async ({ ctx }) => {
    return billingOverviewSchema.parse(
      await getBillingPlansOverview(ctx.user.id),
    );
  }),
  createCheckoutSession: protectedProcedure
    .input(createCheckoutSessionInputSchema)
    .mutation(async ({ ctx, input }) => {
      return createCheckoutSessionSchema.parse(
        await createCheckoutSession({
          userId: ctx.user.id,
          planCode: input.planCode,
        }),
      );
    }),
  verifyCheckout: protectedProcedure
    .input(verifyCheckoutInputSchema)
    .mutation(async ({ ctx, input }) => {
      return verifyCheckoutSchema.parse(
        await verifyCheckoutSignature({
          userId: ctx.user.id,
          ...input,
        }),
      );
    }),
});
