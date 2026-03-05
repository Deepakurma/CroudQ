import { z } from "zod";

export const uploadFolderSchema = z.enum(["properties", "resident"]);

export const generateUploadUrlSchema = z.object({
  folder: uploadFolderSchema,
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().startsWith("image/"),
});

export const deleteS3ObjectSchema = z.object({
  key: z.string().trim().min(1).max(1024).regex(/^(properties|resident)\//, {
    message: "Invalid key prefix",
  }),
});

export type GenerateUploadUrlType = z.infer<typeof generateUploadUrlSchema>;
export type DeleteS3ObjectType = z.infer<typeof deleteS3ObjectSchema>;
