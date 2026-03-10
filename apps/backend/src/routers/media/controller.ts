import { TRPCError } from "@trpc/server";

import {
  createS3ObjectKey,
  createStagingS3ObjectKey,
  deleteS3Object,
  generateUploadUrl,
  getS3FileUrl,
  isS3KeyOwnedByProperty,
} from "../../services/s3-sender";
import { propertyProcedure, protectedProcedure, router } from "../../server/trpc";
import {
  deleteS3ObjectSchema,
  generateUploadUrlSchema,
  generateUserUploadUrlSchema,
} from "./dto";

export const mediaRouter = router({
  generateUploadUrl: propertyProcedure
    .input(generateUploadUrlSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const key = createS3ObjectKey(input.folder, ctx.propertyId, input.contentType);
        const uploadUrl = await generateUploadUrl(
          key,
          input.contentType,
          input.fileSizeBytes,
        );
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

  generateUploadUrlForUser: protectedProcedure
    .input(generateUserUploadUrlSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const key = createStagingS3ObjectKey(ctx.user.id, input.contentType);
        const uploadUrl = await generateUploadUrl(key, input.contentType, input.fileSizeBytes);
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

  deleteObject: propertyProcedure
    .input(deleteS3ObjectSchema)
    .mutation(async ({ input, ctx }) => {
      if (!isS3KeyOwnedByProperty(input.key, ctx.propertyId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to delete this object.",
        });
      }

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
