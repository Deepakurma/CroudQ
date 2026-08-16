import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

const PREFIX = "enc:";
const KEY = createHash("sha256")
  .update(process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY!)
  .digest();

export const encryptSecret = (value: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  return (
    PREFIX +
    Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url")
  );
};

export const decryptSecret = (value: string) => {
  if (!value.startsWith(PREFIX)) {
    return value;
  }

  const data = Buffer.from(value.slice(PREFIX.length), "base64url");

  const decipher = createDecipheriv("aes-256-gcm", KEY, data.subarray(0, 12));

  decipher.setAuthTag(data.subarray(12, 28));

  return Buffer.concat([
    decipher.update(data.subarray(28)),
    decipher.final(),
  ]).toString("utf8");
};
