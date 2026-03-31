import {
  deleteFeedbackByAdmin,
  listFeedbackForAdmin,
} from "../../modules/feedback/controller";
import { assertUserIsAdmin } from "../../modules/auth/controller";
import { createTRPCRouter, protectedProcedure } from "../../server/trpc";
import {
  adminFeedbackListInputSchema,
  adminFeedbackListSchema,
  adminFeedbackMessageSchema,
  deleteAdminFeedbackInputSchema,
} from "./dto";

export const adminFeedbackRouter = createTRPCRouter({
  list: protectedProcedure
    .input(adminFeedbackListInputSchema)
    .query(async ({ ctx, input }) => {
      await assertUserIsAdmin(ctx.user.id);
      return adminFeedbackListSchema.parse(
        await listFeedbackForAdmin({ limit: input.limit, offset: input.offset }),
      );
    }),
  delete: protectedProcedure
    .input(deleteAdminFeedbackInputSchema)
    .mutation(async ({ ctx, input }) => {
      await assertUserIsAdmin(ctx.user.id);
      return adminFeedbackMessageSchema.parse(await deleteFeedbackByAdmin(input.id));
    }),
});
