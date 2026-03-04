
import { router } from "../server/trpc";

import { authRouter } from "./auth/controller";
import { adminRouter } from "./admin/controller";
import { complaintRouter } from "./complaint/controller";
import { noticeRouter } from "./notice/controller";
import { propertyRouter } from "./property/controller";
import { publicPropertyRouter } from "./publicProperty/controller";
import { publicResidentRouter } from "./publicResident/controller";
import { residentRouter } from "./resident/controller";

export const appRouter = router({
    auth: authRouter,
    admin: adminRouter,
    property: propertyRouter,
    publicProperty: publicPropertyRouter,
    publicResident: publicResidentRouter,
    resident: residentRouter,
    complaint: complaintRouter,
    notice: noticeRouter,
});

export type AppRouter = typeof appRouter;
