import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";

import { db } from "../../db";
import { admins, feedback, users, youtubeAccounts } from "../../db/schema";
import { getPendingRenewalsCount } from "../admin-billing/controller";

export const getAdminDashboardOverview = async () => {
  const [[creatorsRow], [connectedCreatorsRow], [feedbackRow], pendingRenewals] =
    await Promise.all([
      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(users)
        .leftJoin(admins, eq(admins.userId, users.id))
        .where(isNull(admins.userId)),
      db
        .select({
          count: sql<number>`count(distinct ${youtubeAccounts.userId})::int`,
        })
        .from(youtubeAccounts)
        .leftJoin(admins, eq(admins.userId, youtubeAccounts.userId))
        .where(isNull(admins.userId)),
      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(feedback),
      getPendingRenewalsCount(),
    ]);

  const totalCreators = creatorsRow?.count ?? 0;
  const connectedCreators = connectedCreatorsRow?.count ?? 0;
  const totalFeedbacks = feedbackRow?.count ?? 0;
  const conversionRate =
    totalCreators > 0 ? Math.round((connectedCreators / totalCreators) * 1000) / 10 : 0;

  return {
    totalCreators,
    connectedCreators,
    conversionRate,
    pendingRenewals,
    totalFeedbacks,
  };
};

const countNewCreatorsBetween = async (start: Date, end: Date) => {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(users)
    .leftJoin(admins, eq(admins.userId, users.id))
    .where(
      and(
        isNull(admins.userId),
        gte(users.createdAt, start),
        lt(users.createdAt, end),
      ),
    );

  return row?.count ?? 0;
};

export const getAdminDashboardCreatorJoins = async () => {
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

  const [
    todayCurrent,
    todayPrevious,
    weekCurrent,
    weekPrevious,
    monthCurrent,
    monthPrevious,
  ] = await Promise.all([
    countNewCreatorsBetween(todayCurrentStart, now),
    countNewCreatorsBetween(todayPreviousStart, todayCurrentStart),
    countNewCreatorsBetween(weekCurrentStart, now),
    countNewCreatorsBetween(weekPreviousStart, weekCurrentStart),
    countNewCreatorsBetween(monthCurrentStart, now),
    countNewCreatorsBetween(monthPreviousStart, monthCurrentStart),
  ]);

  return {
    today: {
      current: todayCurrent,
      previous: todayPrevious,
    },
    week: {
      current: weekCurrent,
      previous: weekPrevious,
    },
    month: {
      current: monthCurrent,
      previous: monthPrevious,
    },
  };
};
