import { createServerTrpcClient } from "./api";

type UploadFolder = "properties" | "resident";

interface UploadImageToS3Input {
  token: string;
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
  const client = createServerTrpcClient(input.token);

  const { uploadUrl, key, fileUrl } = await client.media.generateUploadUrl.mutate({
    folder: input.folder,
    fileName: input.fileName,
    contentType: input.contentType,
  });

  const fileResponse = await fetch(input.fileUri);
  if (!fileResponse.ok) {
    throw new Error("Failed to read local file.");
  }

  const fileBlob = await fileResponse.blob();
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.contentType,
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
