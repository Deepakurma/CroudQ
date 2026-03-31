import {
  getAdminDashboardCreatorJoins,
  getAdminDashboardOverview,
} from "../../modules/admin-dashboard/controller";
import { assertUserIsAdmin } from "../../modules/auth/controller";
import { createTRPCRouter, protectedProcedure } from "../../server/trpc";
import {
  adminDashboardCreatorJoinsSchema,
  adminDashboardOverviewSchema,
} from "./dto";

export const adminDashboardRouter = createTRPCRouter({
  overview: protectedProcedure.query(async ({ ctx }) => {
    await assertUserIsAdmin(ctx.user.id);
    return adminDashboardOverviewSchema.parse(await getAdminDashboardOverview());
  }),
  creatorJoins: protectedProcedure.query(async ({ ctx }) => {
    await assertUserIsAdmin(ctx.user.id);
    return adminDashboardCreatorJoinsSchema.parse(
      await getAdminDashboardCreatorJoins(),
    );
  }),
});
