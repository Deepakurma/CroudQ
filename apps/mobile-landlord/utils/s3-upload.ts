import { createServerTrpcClient } from "./api";

type UploadFolder = "properties" | "resident";
const ALLOWED_IMAGE_CONTENT_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
] as const;
type AllowedImageContentType = (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

const toAllowedImageContentType = (value: string): AllowedImageContentType => {
    if ((ALLOWED_IMAGE_CONTENT_TYPES as readonly string[]).includes(value)) {
        return value as AllowedImageContentType;
    }
    throw new Error("Unsupported image format. Use JPEG, PNG, WEBP, HEIC, or HEIF.");
};

interface UploadImageToS3Input {
    token: string;
    propertyId: string;
    fileUri: string;
    fileName: string;
    contentType: string;
    folder: UploadFolder;
}

interface UploadImageToS3Result {
    key: string;
    fileUrl: string;
}

export const uploadImageToS3 = async (
    input: UploadImageToS3Input,
): Promise<UploadImageToS3Result> => {
    const client = createServerTrpcClient(input.token, input.propertyId);

    const fileResponse = await fetch(input.fileUri);
    if (!fileResponse.ok) {
        throw new Error("Failed to read local file.");
    }

    const fileBlob = await fileResponse.blob();
    const contentType = toAllowedImageContentType(input.contentType);

    const { uploadUrl, key, fileUrl } = await client.media.generateUploadUrl.mutate({
        folder: input.folder,
        fileName: input.fileName,
        contentType,
        fileSizeBytes: fileBlob.size,
    });

    const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": contentType,
        },
        body: fileBlob,
    });

    if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to S3.");
    }

    return {
        key,
        fileUrl,
    };
};
