import { createTRPCRouter } from "../server/trpc";

import { authRouter } from "./auth/controller";
import { insightsRouter } from "./insights/controller";
import { youtubeRouter } from "./youtube/controller";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  insights: insightsRouter,
  youtube: youtubeRouter,
});

export type AppRouter = typeof appRouter;
