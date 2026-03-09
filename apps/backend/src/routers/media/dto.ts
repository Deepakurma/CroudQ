import { z } from "zod";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  MAX_IMAGE_UPLOAD_SIZE_BYTES,
} from "../../services/s3-sender";

export const uploadFolderSchema = z.enum(["properties", "resident"]);
export const contentTypeSchema = z.enum(ALLOWED_IMAGE_CONTENT_TYPES);

export const generateUploadUrlSchema = z.object({
  folder: uploadFolderSchema,
  fileName: z.string().trim().min(1).max(255),
  contentType: contentTypeSchema,
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_IMAGE_UPLOAD_SIZE_BYTES),
});

export const deleteS3ObjectSchema = z.object({
  key: z.string().trim().min(1).max(1024).regex(/^(properties|resident)\/[^/]+\//, {
    message: "Invalid key prefix",
  }),
});

export type GenerateUploadUrlType = z.infer<typeof generateUploadUrlSchema>;
export type DeleteS3ObjectType = z.infer<typeof deleteS3ObjectSchema>;
