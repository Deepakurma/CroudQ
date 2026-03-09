import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const getRequiredEnv = (
  key: "AWS_REGION" | "AWS_ACCESS_KEY" | "AWS_SECRET_KEY" | "AWS_BUCKET",
): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

const region = getRequiredEnv("AWS_REGION");
const bucket = getRequiredEnv("AWS_BUCKET");

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: getRequiredEnv("AWS_ACCESS_KEY"),
    secretAccessKey: getRequiredEnv("AWS_SECRET_KEY"),
  },
});

export type UploadFolder = "properties" | "resident";

export const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

const extensionByContentType: Record<(typeof ALLOWED_IMAGE_CONTENT_TYPES)[number], string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

export const MAX_IMAGE_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export const createS3ObjectKey = (
  folder: UploadFolder,
  propertyId: string,
  contentType: (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number],
): string => {
  const extension = extensionByContentType[contentType];
  return `${folder}/${propertyId}/${crypto.randomUUID()}${extension}`;
};

export const generateUploadUrl = async (
  key: string,
  contentType: string,
  fileSizeBytes: number,
): Promise<string> => {
  if (fileSizeBytes > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
    throw new Error("File size exceeds allowed limit.");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSizeBytes,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: 60 * 5,
  });
};

export const deleteS3Object = async (key: string): Promise<void> => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
};

export const getS3FileUrl = (key: string): string => {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

const isManagedPrefix = (key: string) => {
  return key.startsWith("properties/") || key.startsWith("resident/");
};

export const isS3KeyOwnedByProperty = (key: string, propertyId: string): boolean => {
  return key.startsWith(`properties/${propertyId}/`) || key.startsWith(`resident/${propertyId}/`);
};

export const resolveManagedS3Key = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (isManagedPrefix(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const expectedHost = `${bucket}.s3.${region}.amazonaws.com`;
    if (parsed.hostname !== expectedHost) {
      return null;
    }

    const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    return isManagedPrefix(key) ? key : null;
  } catch {
    return null;
  }
};

export const resolveManagedS3KeyForProperty = (
  value: string | null | undefined,
  propertyId: string,
): string | null => {
  const key = resolveManagedS3Key(value);
  if (!key) return null;
  return isS3KeyOwnedByProperty(key, propertyId) ? key : null;
};
