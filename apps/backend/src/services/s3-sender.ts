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

const sanitizeExtension = (fileName: string): string => {
  const trimmed = fileName.trim();
  if (!trimmed.includes(".")) {
    return ".jpg";
  }

  const rawExtension = trimmed.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExtension = rawExtension.replace(/[^a-z0-9]/g, "");

  return safeExtension ? `.${safeExtension}` : ".jpg";
};

export const createS3ObjectKey = (folder: UploadFolder, fileName: string): string => {
  const ext = sanitizeExtension(fileName);
  return `${folder}/${crypto.randomUUID()}${ext}`;
};

export const generateUploadUrl = async (
  key: string,
  contentType: string,
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
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
