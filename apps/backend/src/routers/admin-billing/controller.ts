import { getAdminBillingOverview } from "../../modules/admin-billing/controller";
import { assertUserIsAdmin } from "../../modules/auth/controller";
import { createTRPCRouter, protectedProcedure } from "../../server/trpc";
import { adminBillingOverviewSchema } from "./dto";

export const adminBillingRouter = createTRPCRouter({
  overview: protectedProcedure.query(async ({ ctx }) => {
    await assertUserIsAdmin(ctx.user.id);
    return adminBillingOverviewSchema.parse(await getAdminBillingOverview());
  }),
});
