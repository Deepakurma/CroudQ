import { createHmac, timingSafeEqual } from "crypto";

import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "../../db";
import {
  billingPlans,
  billingSubscriptions,
  billingWebhookEvents,
  users,
} from "../../db/schema";

const RAZORPAY_API_BASE_URL = "https://api.razorpay.com/v1";
const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "authenticated"] as const;
const REUSABLE_SUBSCRIPTION_STATUSES = [
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
] as const;
const RECOVERABLE_SUBSCRIPTION_STATUSES = ["pending", "halted"] as const;

type BillingPlanSeed = {
  code: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: number;
  period: "monthly" | "yearly";
  totalCount: number;
  tier: string;
};

type RazorpayPlanResponse = {
  id: string;
};

type RazorpaySubscriptionResponse = {
  id: string;
  plan_id: string;
  customer_id?: string | null;
  status: string;
  short_url?: string | null;
  current_start?: number | null;
  current_end?: number | null;
  charge_at?: number | null;
  start_at?: number | null;
  end_at?: number | null;
  expire_by?: number | null;
  quantity?: number | null;
  total_count?: number | null;
  paid_count?: number | null;
  remaining_count?: number | null;
  auth_attempts?: number | null;
  notes?: Record<string, string> | null;
};

type RazorpayWebhookPayload = {
  event: string;
  payload?: {
    subscription?: {
      entity?: RazorpaySubscriptionResponse & {
        payment_id?: string | null;
      };
    };
    payment?: {
      entity?: {
        id?: string;
        invoice_id?: string | null;
      };
    };
  };
};

const DEFAULT_BILLING_PLANS: BillingPlanSeed[] = [
  {
    code: "croudq-pro-monthly",
    name: "CroudQ Pro Monthly",
    description: "Monthly recurring plan for creators",
    amount: 79900,
    currency: "INR",
    interval: 1,
    period: "monthly",
    totalCount: 60,
    tier: "CroudQ Pro",
  },
];

const toDate = (timestamp?: number | null) =>
  typeof timestamp === "number" ? new Date(timestamp * 1000) : null;

const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);

const hasProviderPlanConfigChanged = (
  existingPlan: typeof billingPlans.$inferSelect,
  nextPlan: BillingPlanSeed,
) =>
  existingPlan.amount !== nextPlan.amount ||
  existingPlan.currency !== nextPlan.currency ||
  existingPlan.interval !== nextPlan.interval ||
  existingPlan.period !== nextPlan.period ||
  existingPlan.totalCount !== nextPlan.totalCount;

const getRazorpayCredentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Razorpay is not configured",
    });
  }

  return { keyId, keySecret };
};

const getRazorpayWebhookSecret = () => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

  if (!secret) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Razorpay webhook secret is not configured",
    });
  }

  return secret;
};

const createDigest = (value: string, secret: string) =>
  createHmac("sha256", secret).update(value).digest("hex");

const secureCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

const getRazorpayAuthHeader = () => {
  const { keyId, keySecret } = getRazorpayCredentials();
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
};

const razorpayRequest = async <TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> => {
  const response = await fetch(`${RAZORPAY_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: getRazorpayAuthHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Razorpay request failed: ${errorText || response.statusText}`,
    });
  }

  return (await response.json()) as TResponse;
};

const ensureBillingPlansSeeded = async () => {
  const existingPlans = await db.query.billingPlans.findMany();
  const defaultPlanCodes = new Set(
    DEFAULT_BILLING_PLANS.map((plan) => plan.code),
  );
  const existingPlanCodes = new Set(existingPlans.map((plan) => plan.code));
  const now = new Date();

  const missingPlans = DEFAULT_BILLING_PLANS.filter(
    (plan) => !existingPlanCodes.has(plan.code),
  );

  if (missingPlans.length > 0) {
    await db.insert(billingPlans).values(
      missingPlans.map((plan) => ({
        ...plan,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  for (const plan of DEFAULT_BILLING_PLANS) {
    const existingPlan = existingPlans.find(
      (entry) => entry.code === plan.code,
    );

    if (!existingPlan) {
      continue;
    }

    const needsUpdate =
      existingPlan.name !== plan.name ||
      existingPlan.description !== plan.description ||
      existingPlan.amount !== plan.amount ||
      existingPlan.currency !== plan.currency ||
      existingPlan.interval !== plan.interval ||
      existingPlan.period !== plan.period ||
      existingPlan.totalCount !== plan.totalCount ||
      existingPlan.tier !== plan.tier ||
      existingPlan.isActive !== true;

    if (!needsUpdate) {
      continue;
    }

    await db
      .update(billingPlans)
      .set({
        name: plan.name,
        description: plan.description,
        amount: plan.amount,
        currency: plan.currency,
        interval: plan.interval,
        period: plan.period,
        totalCount: plan.totalCount,
        tier: plan.tier,
        providerPlanId: hasProviderPlanConfigChanged(existingPlan, plan)
          ? null
          : existingPlan.providerPlanId,
        isActive: true,
        updatedAt: now,
      })
      .where(eq(billingPlans.id, existingPlan.id));
  }

  for (const existingPlan of existingPlans) {
    if (defaultPlanCodes.has(existingPlan.code) || !existingPlan.isActive) {
      continue;
    }

    await db
      .update(billingPlans)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(eq(billingPlans.id, existingPlan.id));
  }

  return db.query.billingPlans.findMany({
    where: eq(billingPlans.isActive, true),
    orderBy: [billingPlans.amount],
  });
};

const ensureProviderPlan = async (
  plan: typeof billingPlans.$inferSelect,
): Promise<typeof billingPlans.$inferSelect> => {
  if (plan.providerPlanId) {
    return plan;
  }

  const createdPlan = await razorpayRequest<RazorpayPlanResponse>("/plans", {
    method: "POST",
    body: JSON.stringify({
      period: plan.period,
      interval: plan.interval,
      item: {
        name: plan.name,
        amount: plan.amount,
        currency: plan.currency,
        description: plan.description ?? undefined,
      },
      notes: {
        plan_code: plan.code,
        tier: plan.tier,
      },
    }),
  });

  const [updatedPlan] = await db
    .update(billingPlans)
    .set({
      providerPlanId: createdPlan.id,
      updatedAt: new Date(),
    })
    .where(eq(billingPlans.id, plan.id))
    .returning();

  return updatedPlan;
};

const serializeNotes = (notes?: Record<string, string> | null) =>
  notes ? JSON.stringify(notes) : null;

const applySubscriptionSnapshot = async (input: {
  userId: string;
  subscription: RazorpaySubscriptionResponse;
  localPlanId: string;
  paymentId?: string | null;
  latestInvoiceId?: string | null;
}) => {
  const now = new Date();
  const existing = await db.query.billingSubscriptions.findFirst({
    where: eq(
      billingSubscriptions.providerSubscriptionId,
      input.subscription.id,
    ),
  });
  const payload = {
    planId: input.localPlanId,
    provider: "razorpay",
    providerSubscriptionId: input.subscription.id,
    providerPlanId: input.subscription.plan_id,
    providerCustomerId: input.subscription.customer_id ?? null,
    status: input.subscription.status,
    paymentId: input.paymentId ?? null,
    latestInvoiceId: input.latestInvoiceId ?? null,
    shortUrl: input.subscription.short_url ?? null,
    quantity: input.subscription.quantity ?? 1,
    totalCount: input.subscription.total_count ?? null,
    paidCount: input.subscription.paid_count ?? null,
    remainingCount: input.subscription.remaining_count ?? null,
    currentStart: toDate(input.subscription.current_start),
    currentEnd: toDate(input.subscription.current_end),
    chargeAt: toDate(input.subscription.charge_at),
    startAt: toDate(input.subscription.start_at),
    endAt: toDate(input.subscription.end_at),
    expireBy: toDate(input.subscription.expire_by),
    authenticatedAt:
      existing?.authenticatedAt ??
      (input.subscription.status === "authenticated" ||
      input.subscription.status === "active"
        ? now
        : null),
    activatedAt:
      existing?.activatedAt ??
      (input.subscription.status === "active" ? now : null),
    cancelledAt:
      existing?.cancelledAt ??
      (input.subscription.status === "cancelled" ? now : null),
    completedAt:
      existing?.completedAt ??
      (input.subscription.status === "completed" ? now : null),
    endedAt:
      existing?.endedAt ??
      (input.subscription.status === "cancelled" ||
      input.subscription.status === "completed"
        ? now
        : null),
    notesJson: serializeNotes(input.subscription.notes),
    updatedAt: now,
  };

  if (existing) {
    const [updated] = await db
      .update(billingSubscriptions)
      .set(payload)
      .where(eq(billingSubscriptions.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(billingSubscriptions)
    .values({
      userId: input.userId,
      createdAt: now,
      ...payload,
    })
    .returning();

  return created;
};

const getPlanByCode = async (code: string) => {
  await ensureBillingPlansSeeded();

  const plan = await db.query.billingPlans.findFirst({
    where: and(eq(billingPlans.code, code), eq(billingPlans.isActive, true)),
  });

  if (!plan) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Billing plan not found",
    });
  }

  return plan;
};

const getCurrentSubscriptionRecord = async (userId: string) =>
  db.query.billingSubscriptions.findFirst({
    where: and(
      eq(billingSubscriptions.userId, userId),
      inArray(
        billingSubscriptions.status,
        REUSABLE_SUBSCRIPTION_STATUSES as unknown as string[],
      ),
    ),
    orderBy: [desc(billingSubscriptions.updatedAt)],
  });

export const getCurrentUserSubscriptionState = async (
  userId: string,
): Promise<"active" | "ended" | "none"> => {
  const latestSubscription = await db.query.billingSubscriptions.findFirst({
    where: eq(billingSubscriptions.userId, userId),
    orderBy: [desc(billingSubscriptions.updatedAt)],
  });

  if (!latestSubscription) {
    return "none";
  }

  return ACTIVE_SUBSCRIPTION_STATUSES.includes(
    latestSubscription.status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number],
  )
    ? "active"
    : "ended";
};

const fetchSubscriptionFromProvider = (subscriptionId: string) =>
  razorpayRequest<RazorpaySubscriptionResponse>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );

export const getBillingPlansOverview = async (userId: string) => {
  const plans = await ensureBillingPlansSeeded();
  const currentSubscription = await db.query.billingSubscriptions.findFirst({
    where: eq(billingSubscriptions.userId, userId),
    orderBy: [desc(billingSubscriptions.updatedAt)],
  });

  const activePlan =
    currentSubscription &&
    (await db.query.billingPlans.findFirst({
      where: eq(billingPlans.id, currentSubscription.planId),
    }));

  return {
    plans: plans.map((plan) => ({
      code: plan.code,
      name: plan.name,
      description: plan.description,
      currency: plan.currency,
      amount: plan.amount,
      amountLabel: formatPrice(plan.amount, plan.currency),
      interval: plan.interval,
      period: plan.period,
      tier: plan.tier,
    })),
    currentSubscription: currentSubscription
      ? {
          planCode: activePlan?.code ?? null,
          planName: activePlan?.name ?? null,
          status: currentSubscription.status,
          tier: activePlan?.tier ?? null,
          currentPeriodEndsAt:
            currentSubscription.currentEnd?.toISOString() ?? null,
          cancelAtCycleEnd: currentSubscription.cancelAtCycleEnd,
        }
      : null,
  };
};

export const getCurrentUserTier = async (userId: string) => {
  const activeSubscription = await db.query.billingSubscriptions.findFirst({
    where: and(
      eq(billingSubscriptions.userId, userId),
      inArray(
        billingSubscriptions.status,
        ACTIVE_SUBSCRIPTION_STATUSES as unknown as string[],
      ),
    ),
    orderBy: [desc(billingSubscriptions.updatedAt)],
  });

  if (!activeSubscription) {
    return null;
  }

  const plan = await db.query.billingPlans.findFirst({
    where: eq(billingPlans.id, activeSubscription.planId),
  });

  return plan?.tier ?? null;
};

export const createCheckoutSession = async (input: {
  userId: string;
  planCode: string;
}) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, input.userId),
  });

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  const rawPlan = await getPlanByCode(input.planCode);
  const plan = await ensureProviderPlan(rawPlan);
  const currentSubscription = await getCurrentSubscriptionRecord(input.userId);

  if (
    currentSubscription &&
    currentSubscription.providerSubscriptionId &&
    (currentSubscription.status === "created" ||
      RECOVERABLE_SUBSCRIPTION_STATUSES.includes(
        currentSubscription.status as (typeof RECOVERABLE_SUBSCRIPTION_STATUSES)[number],
      )) &&
    currentSubscription.planId === plan.id
  ) {
    return {
      keyId: getRazorpayCredentials().keyId,
      subscriptionId: currentSubscription.providerSubscriptionId,
      plan: {
        code: plan.code,
        name: plan.name,
        amount: plan.amount,
        currency: plan.currency,
      },
      prefill: {
        name: user.name ?? "",
      },
      existing: true,
      recovery: currentSubscription.status !== "created",
    };
  }

  if (currentSubscription) {
    const currentPlan = await db.query.billingPlans.findFirst({
      where: eq(billingPlans.id, currentSubscription.planId),
    });

    throw new TRPCError({
      code: "CONFLICT",
      message: `You already have a ${
        currentPlan?.name ?? "Creator Pro"
      } subscription in ${currentSubscription.status} status`,
    });
  }

  const subscription = await razorpayRequest<RazorpaySubscriptionResponse>(
    "/subscriptions",
    {
      method: "POST",
      body: JSON.stringify({
        plan_id: plan.providerPlanId,
        total_count: plan.totalCount,
        quantity: 1,
        customer_notify: 1,
        expire_by: Math.floor(Date.now() / 1000) + 15 * 60,
        notes: {
          plan_code: plan.code,
          user_id: user.id,
        },
      }),
    },
  );

  await applySubscriptionSnapshot({
    userId: user.id,
    subscription,
    localPlanId: plan.id,
  });

  return {
    keyId: getRazorpayCredentials().keyId,
    subscriptionId: subscription.id,
    plan: {
      code: plan.code,
      name: plan.name,
      amount: plan.amount,
      currency: plan.currency,
    },
    prefill: {
      name: user.name ?? "",
    },
    existing: false,
    recovery: false,
  };
};

export const verifyCheckoutSignature = async (input: {
  userId: string;
  planCode: string;
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpaySignature: string;
}) => {
  const { keySecret } = getRazorpayCredentials();
  const expectedSignature = createDigest(
    `${input.razorpayPaymentId}|${input.razorpaySubscriptionId}`,
    keySecret,
  );

  if (!secureCompare(expectedSignature, input.razorpaySignature)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Razorpay payment signature is invalid",
    });
  }

  const plan = await getPlanByCode(input.planCode);
  const subscription = await fetchSubscriptionFromProvider(
    input.razorpaySubscriptionId,
  );

  if (subscription.notes?.user_id !== input.userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This checkout does not belong to the current user",
    });
  }

  const matchesPlan =
    subscription.plan_id === plan.providerPlanId ||
    subscription.notes?.plan_code === input.planCode;

  if (!matchesPlan) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This checkout does not match the selected billing plan",
    });
  }

  await applySubscriptionSnapshot({
    userId: input.userId,
    subscription,
    localPlanId: plan.id,
    paymentId: input.razorpayPaymentId,
  });

  if (
    !ACTIVE_SUBSCRIPTION_STATUSES.includes(
      subscription.status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number],
    )
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Subscription is not active yet. Current status: ${subscription.status}`,
    });
  }

  return {
    success: true as const,
    status: subscription.status,
  };
};

export const processRazorpayWebhook = async (
  rawBody: string,
  signature: string,
) => {
  const expectedSignature = createDigest(rawBody, getRazorpayWebhookSecret());

  if (!secureCompare(expectedSignature, signature)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Razorpay webhook signature is invalid",
    });
  }

  const payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  const payloadHash = createDigest(rawBody, "croudq-razorpay-webhook");
  const subscriptionEntity = payload.payload?.subscription?.entity;
  const providerSubscriptionId = subscriptionEntity?.id ?? null;

  const [storedEvent] = await db
    .insert(billingWebhookEvents)
    .values({
      provider: "razorpay",
      eventType: payload.event,
      payloadHash,
      providerSubscriptionId,
      payloadJson: rawBody,
    })
    .onConflictDoNothing({
      target: billingWebhookEvents.payloadHash,
    })
    .returning();

  if (!storedEvent || !subscriptionEntity) {
    return { processed: Boolean(storedEvent), ignored: true as const };
  }

  const planCode = subscriptionEntity.notes?.plan_code ?? null;
  const userId = subscriptionEntity.notes?.user_id ?? null;

  if (!planCode || !userId) {
    return { processed: true as const, ignored: true as const };
  }

  const plan = await getPlanByCode(planCode);
  const paymentId = payload.payload?.payment?.entity?.id ?? null;
  const latestInvoiceId = payload.payload?.payment?.entity?.invoice_id ?? null;

  await applySubscriptionSnapshot({
    userId,
    subscription: subscriptionEntity,
    localPlanId: plan.id,
    paymentId,
    latestInvoiceId,
  });

  await db
    .update(billingSubscriptions)
    .set({
      userId,
      updatedAt: new Date(),
    })
    .where(
      eq(billingSubscriptions.providerSubscriptionId, subscriptionEntity.id),
    );

  return {
    processed: true as const,
    ignored: false as const,
  };
};
