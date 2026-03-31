import { notInArray } from "drizzle-orm";

import { db, conn } from "../src/db";
import {
  admins,
  authRateLimits,
  revokedTokens,
  users,
} from "../src/db/schema";

const hasYesFlag = Bun.argv.includes("--yes");

const main = async () => {
  if (!hasYesFlag) {
    throw new Error(
      "Refusing to reset data without confirmation. Re-run with --yes",
    );
  }

  const adminRows = await db.select({ userId: admins.userId }).from(admins);
  const adminUserIds = Array.from(
    new Set(adminRows.map((row) => row.userId).filter(Boolean)),
  );

  await db.transaction(async (tx) => {
    // Global auth tables; safe to clear in reset workflows.
    await tx.delete(authRateLimits);
    await tx.delete(revokedTokens);

    // Keep admin users (and their cascaded auth/admin records), drop all others.
    if (adminUserIds.length > 0) {
      await tx.delete(users).where(notInArray(users.id, adminUserIds));
      return;
    }

    // If no admins exist, reset all users too.
    await tx.delete(users);
  });

  console.log(
    `Reset complete. Preserved admin users: ${adminUserIds.length}. Removed non-admin data.`,
  );
};

main()
  .catch((error) => {
    console.error("Failed to reset app data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await conn.end();
  });
