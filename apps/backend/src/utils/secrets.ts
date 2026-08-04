// import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// const ENCRYPTED_PREFIX = "enc:";

// const getEncryptionKey = (envKey: "YOUTUBE_TOKEN_ENCRYPTION_KEY") => {
//   const value = process.env[envKey];
//   if (!value) {
//     throw new Error(`${envKey} is required`);
//   }

//   return createHash("sha256").update(value).digest();
// };

// export const encryptSecret = (
//   value: string,
//   envKey: "YOUTUBE_TOKEN_ENCRYPTION_KEY",
// ) => {
//   const key = getEncryptionKey(envKey);
//   const iv = randomBytes(12);
//   const cipher = createCipheriv("aes-256-gcm", key, iv);
//   const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
//   const authTag = cipher.getAuthTag();

//   return `${ENCRYPTED_PREFIX}${Buffer.concat([iv, authTag, encrypted]).toString("base64url")}`;
// };

// export const decryptSecret = (
//   value: string,
//   envKey: "YOUTUBE_TOKEN_ENCRYPTION_KEY",
// ) => {
//   if (!value.startsWith(ENCRYPTED_PREFIX)) {
//     return value;
//   }

//   const payload = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), "base64url");
//   const iv = payload.subarray(0, 12);
//   const authTag = payload.subarray(12, 28);
//   const encrypted = payload.subarray(28);
//   const key = getEncryptionKey(envKey);
//   const decipher = createDecipheriv("aes-256-gcm", key, iv);
//   decipher.setAuthTag(authTag);

//   return Buffer.concat([
//     decipher.update(encrypted),
//     decipher.final(),
//   ]).toString("utf8");
// };

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
