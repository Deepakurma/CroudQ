import { desc, eq } from "drizzle-orm";

import { conn, db } from "../src/db";
import { billingPlans, billingSubscriptions, users } from "../src/db/schema";

const DEFAULT_PLAN = {
  code: "creator-pro-monthly",
  name: "Creator Pro Monthly",
  description: "Monthly recurring plan for active creators",
  amount: 99900,
  currency: "INR",
  interval: 1,
  period: "monthly" as const,
  totalCount: 60,
  tier: "CroudQ Pro",
};

type SubscriptionState = "active" | "ended" | "none";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const readArg = (name: string) => {
  const prefix = `--${name}=`;
  return Bun.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const ensurePlan = async () => {
  const existingPlan = await db.query.billingPlans.findFirst({
    where: eq(billingPlans.code, DEFAULT_PLAN.code),
  });

  if (existingPlan) {
    return existingPlan;
  }

  const now = new Date();
  const [createdPlan] = await db
    .insert(billingPlans)
    .values({
      ...DEFAULT_PLAN,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return createdPlan;
};

const main = async () => {
  const email = readArg("email");
  const state = (readArg("state") ?? "active") as SubscriptionState;

  if (!email) {
    throw new Error("Missing --email=user@example.com");
  }

  if (!["active", "ended", "none"].includes(state)) {
    throw new Error("Invalid --state. Use active, ended, or none");
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  if (!user) {
    throw new Error(`User not found for ${normalizedEmail}`);
  }

  if (state === "none") {
    await db
      .delete(billingSubscriptions)
      .where(eq(billingSubscriptions.userId, user.id));

    console.log(`Removed all subscription rows for ${normalizedEmail}`);
    return;
  }

  const plan = await ensurePlan();
  const now = new Date();
  const currentEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const latestSubscription = await db.query.billingSubscriptions.findFirst({
    where: eq(billingSubscriptions.userId, user.id),
    orderBy: [desc(billingSubscriptions.updatedAt)],
  });

  const nextStatus = state === "active" ? "active" : "completed";

  if (latestSubscription) {
    await db
      .update(billingSubscriptions)
      .set({
        planId: plan.id,
        provider: "razorpay",
        providerPlanId: latestSubscription.providerPlanId ?? plan.providerPlanId,
        status: nextStatus,
        currentStart: state === "active" ? now : latestSubscription.currentStart,
        currentEnd: state === "active" ? currentEnd : now,
        activatedAt:
          state === "active"
            ? (latestSubscription.activatedAt ?? now)
            : latestSubscription.activatedAt,
        completedAt:
          state === "ended" ? (latestSubscription.completedAt ?? now) : null,
        endedAt: state === "ended" ? now : null,
        updatedAt: now,
      })
      .where(eq(billingSubscriptions.id, latestSubscription.id));

    console.log(`Updated subscription for ${normalizedEmail} to ${state}`);
    return;
  }

  await db.insert(billingSubscriptions).values({
    id: crypto.randomUUID(),
    userId: user.id,
    planId: plan.id,
    provider: "razorpay",
    providerSubscriptionId: `manual_temp_${user.id}`,
    providerPlanId: plan.providerPlanId,
    status: nextStatus,
    currentStart: now,
    currentEnd: state === "active" ? currentEnd : now,
    activatedAt: state === "active" ? now : null,
    completedAt: state === "ended" ? now : null,
    endedAt: state === "ended" ? now : null,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Created ${state} subscription for ${normalizedEmail}`);
};

main()
  .catch((error) => {
    console.error("Failed to set user subscription:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await conn.end();
  });
