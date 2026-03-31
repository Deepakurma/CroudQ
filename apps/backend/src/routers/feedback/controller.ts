import { submitFeedback } from "../../modules/feedback/controller";
import { createTRPCRouter, protectedProcedure } from "../../server/trpc";
import { feedbackMessageSchema, submitFeedbackInputSchema } from "./dto";

export const feedbackRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(submitFeedbackInputSchema)
    .mutation(async ({ ctx, input }) =>
      feedbackMessageSchema.parse(
        await submitFeedback({
          userId: ctx.user.id,
          name: ctx.user.name,
          email: ctx.user.email,
          message: input.message,
        }),
      ),
    ),
});
