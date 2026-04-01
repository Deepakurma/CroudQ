import { createTRPCRouter } from "../server/trpc";

import { adminAuthRouter } from "./admin-auth/controller";
import { adminBillingRouter } from "./admin-billing/controller";
import { adminDashboardRouter } from "./admin-dashboard/controller";
import { adminFeedbackRouter } from "./admin-feedback/controller";
import { authRouter } from "./auth/controller";
import { billingRouter } from "./billing/controller";
import { feedbackRouter } from "./feedback/controller";
import { insightsRouter } from "./insights/controller";
import { youtubeRouter } from "./youtube/controller";

export const appRouter = createTRPCRouter({
  adminAuth: adminAuthRouter,
  adminBilling: adminBillingRouter,
  adminDashboard: adminDashboardRouter,
  adminFeedback: adminFeedbackRouter,
  auth: authRouter,
  billing: billingRouter,
  feedback: feedbackRouter,
  insights: insightsRouter,
  youtube: youtubeRouter,
});

export type AppRouter = typeof appRouter;
