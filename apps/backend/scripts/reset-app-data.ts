import { db, conn } from "../src/db";
import {
  admins,
  authRateLimits,
  authSessions,
  billingPlans,
  billingSubscriptions,
  billingWebhookEvents,
  comments,
  feedback,
  insightArtifacts,
  oauthStates,
  passwordResetTokens,
  revokedTokens,
  userCredentials,
  users,
  videos,
  webLoginTokens,
  youtubeAccounts,
} from "../src/db/schema";

const hasYesFlag = Bun.argv.includes("--yes");

const main = async () => {
  if (!hasYesFlag) {
    throw new Error(
      "Refusing to reset data without confirmation. Re-run with --yes",
    );
  }

  await db.transaction(async (tx) => {
    await tx.delete(billingWebhookEvents);
    await tx.delete(comments);
    await tx.delete(videos);
    await tx.delete(youtubeAccounts);
    await tx.delete(feedback);
    await tx.delete(insightArtifacts);
    await tx.delete(webLoginTokens);
    await tx.delete(oauthStates);
    await tx.delete(passwordResetTokens);
    await tx.delete(authSessions);
    await tx.delete(userCredentials);
    await tx.delete(billingSubscriptions);
    await tx.delete(admins);
    await tx.delete(users);
    await tx.delete(billingPlans);
    await tx.delete(authRateLimits);
    await tx.delete(revokedTokens);
  });

  console.log("Reset complete. Cleared all app data tables.");
};

main()
  .catch((error) => {
    console.error("Failed to reset app data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await conn.end();
  });
