import { TRPCError } from "@trpc/server";

import {
  createS3ObjectKey,
  deleteS3Object,
  generateUploadUrl,
  getS3FileUrl,
} from "../../services/s3-sender";
import { protectedProcedure, router } from "../../server/trpc";
import { deleteS3ObjectSchema, generateUploadUrlSchema } from "./dto";

export const mediaRouter = router({
  generateUploadUrl: protectedProcedure
    .input(generateUploadUrlSchema)
    .mutation(async ({ input }) => {
      try {
        const key = createS3ObjectKey(input.folder, input.fileName);
        const uploadUrl = await generateUploadUrl(key, input.contentType);
        const fileUrl = getS3FileUrl(key);

        return {
          uploadUrl,
          key,
          fileUrl,
          expiresInSeconds: 300,
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create upload URL.",
        });
      }
    }),

  deleteObject: protectedProcedure
    .input(deleteS3ObjectSchema)
    .mutation(async ({ input }) => {
      try {
        await deleteS3Object(input.key);
        return { success: true };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete S3 object.",
        });
      }
    }),
});
