import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";

import { db } from "../../db";
import {
  admins,
  billingPlans,
  billingSubscriptions,
  billingWebhookEvents,
  users,
} from "../../db/schema";

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "authenticated"] as const;

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, delta: number) =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

const buildMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", { month: "long" }).format(date);

const sumRevenueBetween = (
  events: Array<{ processedAt: Date; amount: number }>,
  start: Date,
  end: Date,
) =>
  events.reduce((total, event) => {
    if (event.processedAt >= start && event.processedAt < end) {
      return total + event.amount;
    }

    return total;
  }, 0);

export const getPendingRenewalsCount = async () => {
  const now = new Date();
  const latestSubscriptions = await db
    .select({
      userId: billingSubscriptions.userId,
      status: billingSubscriptions.status,
      currentEnd: billingSubscriptions.currentEnd,
      endedAt: billingSubscriptions.endedAt,
    })
    .from(billingSubscriptions)
    .innerJoin(users, eq(users.id, billingSubscriptions.userId))
    .leftJoin(admins, eq(admins.userId, users.id))
    .where(isNull(admins.userId))
    .orderBy(desc(billingSubscriptions.updatedAt));

  const latestByUser = new Map<string, (typeof latestSubscriptions)[number]>();

  for (const subscription of latestSubscriptions) {
    if (!latestByUser.has(subscription.userId)) {
      latestByUser.set(subscription.userId, subscription);
    }
  }

  let count = 0;

  for (const subscription of latestByUser.values()) {
    const isActive = ACTIVE_SUBSCRIPTION_STATUSES.includes(
      subscription.status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number],
    );

    if (isActive) {
      continue;
    }

    const hasEnded =
      subscription.endedAt !== null ||
      (subscription.currentEnd !== null && subscription.currentEnd < now);

    if (hasEnded) {
      count += 1;
    }
  }

  return count;
};

export const getAdminBillingOverview = async () => {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;
  const monthMs = 30 * dayMs;

  const todayCurrentStart = new Date(now.getTime() - dayMs);
  const todayPreviousStart = new Date(now.getTime() - 2 * dayMs);
  const weekCurrentStart = new Date(now.getTime() - weekMs);
  const weekPreviousStart = new Date(now.getTime() - 2 * weekMs);
  const monthCurrentStart = new Date(now.getTime() - monthMs);
  const monthPreviousStart = new Date(now.getTime() - 2 * monthMs);
  const monthlySeriesStart = addMonths(startOfMonth(now), -11);

  const [summaryRow, activeSubscriptionsRow, pendingRenewalsCount, chargedEvents] =
    await Promise.all([
      db
        .select({
          totalRevenue: sql<number>`coalesce(sum(${billingPlans.amount}), 0)::int`,
        })
        .from(billingWebhookEvents)
        .innerJoin(
          billingSubscriptions,
          eq(
            billingSubscriptions.providerSubscriptionId,
            billingWebhookEvents.providerSubscriptionId,
          ),
        )
        .innerJoin(billingPlans, eq(billingPlans.id, billingSubscriptions.planId))
        .innerJoin(users, eq(users.id, billingSubscriptions.userId))
        .leftJoin(admins, eq(admins.userId, users.id))
        .where(
          and(
            eq(billingWebhookEvents.eventType, "subscription.charged"),
            isNull(admins.userId),
          ),
        ),
      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(billingSubscriptions)
        .innerJoin(users, eq(users.id, billingSubscriptions.userId))
        .leftJoin(admins, eq(admins.userId, users.id))
        .where(
          and(
            inArray(
              billingSubscriptions.status,
              ACTIVE_SUBSCRIPTION_STATUSES as unknown as string[],
            ),
            isNull(admins.userId),
          ),
        ),
      getPendingRenewalsCount(),
      db
        .select({
          processedAt: billingWebhookEvents.processedAt,
          amount: billingPlans.amount,
        })
        .from(billingWebhookEvents)
        .innerJoin(
          billingSubscriptions,
          eq(
            billingSubscriptions.providerSubscriptionId,
            billingWebhookEvents.providerSubscriptionId,
          ),
        )
        .innerJoin(billingPlans, eq(billingPlans.id, billingSubscriptions.planId))
        .innerJoin(users, eq(users.id, billingSubscriptions.userId))
        .leftJoin(admins, eq(admins.userId, users.id))
        .where(
          and(
            eq(billingWebhookEvents.eventType, "subscription.charged"),
            gte(billingWebhookEvents.processedAt, monthlySeriesStart),
            isNull(admins.userId),
          ),
        ),
    ]);

  const normalizedEvents = chargedEvents.map((event) => ({
    processedAt: event.processedAt,
    amount: event.amount,
  }));

  const monthlyRevenue = Array.from({ length: 12 }, (_, index) => {
    const monthStart = addMonths(monthlySeriesStart, index);
    const nextMonthStart = addMonths(monthStart, 1);

    return {
      month: buildMonthLabel(monthStart),
      stat: sumRevenueBetween(normalizedEvents, monthStart, nextMonthStart),
    };
  });

  return {
    summary: {
      totalRevenue: summaryRow[0]?.totalRevenue ?? 0,
      totalSubscriptions: activeSubscriptionsRow[0]?.count ?? 0,
      pendingSubscriptions: pendingRenewalsCount,
    },
    revenueStats: {
      today: {
        current: sumRevenueBetween(normalizedEvents, todayCurrentStart, now),
        previous: sumRevenueBetween(normalizedEvents, todayPreviousStart, todayCurrentStart),
      },
      week: {
        current: sumRevenueBetween(normalizedEvents, weekCurrentStart, now),
        previous: sumRevenueBetween(normalizedEvents, weekPreviousStart, weekCurrentStart),
      },
      month: {
        current: sumRevenueBetween(normalizedEvents, monthCurrentStart, now),
        previous: sumRevenueBetween(normalizedEvents, monthPreviousStart, monthCurrentStart),
      },
    },
    monthlyRevenue,
  };
};
