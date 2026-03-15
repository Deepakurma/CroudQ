import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "../../db";
import {
  complaints,
  feedbacks,
  properties,
  propertyRoomTypes,
  residents,
  rooms,
  superAdmins,
  supportQueries,
  users,
} from "../../db/schema";
import {
  protectedProcedure,
  publicProcedure,
  router,
  superAdminProcedure,
} from "../../server/trpc";
import {
  idSchema,
  listFeedbacksSchema,
  listQueriesSchema,
  listLandlordsSchema,
  setLandlordFreezeSchema,
  submitFeedbackSchema,
  submitLandlordQuerySchema,
} from "./dto";

const DAY_MS = 24 * 60 * 60 * 1000;

const getLastTwelveMonths = (
  baseDate: Date,
): Array<{ key: string; label: string; month: number; year: number }> => {
  const result: Array<{
    key: string;
    label: string;
    month: number;
    year: number;
  }> = [];
  const working = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  for (let i = 11; i >= 0; i -= 1) {
    const itemDate = new Date(working.getFullYear(), working.getMonth() - i, 1);
    const month = itemDate.getMonth() + 1;
    const year = itemDate.getFullYear();
    const key = `${year}-${month}`;
    const label = itemDate.toLocaleString("en-US", { month: "long" });
    result.push({ key, label, month, year });
  }
  return result;
};

const normalizeStartDate = (value?: Date) => {
  if (!value) return undefined;
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
};

const normalizeEndDate = (value?: Date) => {
  if (!value) return undefined;
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    23,
    59,
    59,
    999,
  );
};

const buildLandlordsWhere = ({
  q,
  from,
  to,
  status,
}: {
  q?: string;
  from?: Date;
  to?: Date;
  status?: "Active" | "Pending Renewal" | "Frozen";
}) => {
  const startDate = normalizeStartDate(from);
  const endDate = normalizeEndDate(to);
  const now = new Date();
  const pendingCutoff = new Date(now.getTime() - 335 * DAY_MS);

  const conditions = [];
  if (q) {
    conditions.push(
      sql`(
                setweight(to_tsvector('english', coalesce(${properties.name}, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(${properties.area}, '')), 'B') ||
                setweight(to_tsvector('english', coalesce(${properties.city}, '')), 'C') ||
                setweight(to_tsvector('english', coalesce(${properties.addressLine1}, '')), 'D') ||
                setweight(to_tsvector('english', coalesce(${properties.type}, '')), 'D')
            ) @@ websearch_to_tsquery('english', ${q})`,
    );
  }
  if (startDate) conditions.push(gte(properties.createdAt, startDate));
  if (endDate) conditions.push(lte(properties.createdAt, endDate));
  if (status === "Frozen") {
    conditions.push(sql`${properties.isFrozen} is true`);
  }
  if (status === "Pending Renewal") {
    conditions.push(sql`${properties.isFrozen} is not true`);
    conditions.push(lte(properties.createdAt, pendingCutoff));
  }
  if (status === "Active") {
    conditions.push(sql`${properties.isFrozen} is not true`);
    conditions.push(gte(properties.createdAt, pendingCutoff));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
};

const getLandlordsForAdmin = async ({
  limit = 20,
  offset = 0,
  q,
  from,
  to,
  status,
}: {
  limit?: number;
  offset?: number;
  q?: string;
  from?: Date;
  to?: Date;
  status?: "Active" | "Pending Renewal" | "Frozen";
}) => {
  const where = buildLandlordsWhere({ q, from, to, status });
  const propertiesData = await db.query.properties.findMany({
    orderBy: desc(properties.createdAt),
    limit,
    offset,
    where,
    with: {
      facilities: true,
      roomTypes: true,
      rooms: {
        columns: {
          id: true,
          typeId: true,
        },
      },
      residents: {
        columns: {
          id: true,
          active: true,
        },
      },
    },
  });

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * DAY_MS);

  const items = propertiesData.map((property) => {
    const facility = property.facilities[0];
    const roomCountsByType = new Map<string, number>();
    for (const room of property.rooms) {
      if (!room.typeId) continue;
      roomCountsByType.set(
        room.typeId,
        (roomCountsByType.get(room.typeId) || 0) + 1,
      );
    }

    const roomTypes = property.roomTypes.map((roomType) => {
      const capacity = Math.max(roomType.maxOccupancy || 1, 1);
      const roomPrice = roomType.rentAmount || 0;
      const personPrice = Math.round(roomPrice / capacity);
      const roomsCount = roomCountsByType.get(roomType.id) || 0;
      return {
        capacity,
        roomPrice,
        personPrice,
        rooms: roomsCount,
      };
    });

    const totalCapacity = roomTypes.reduce(
      (sum, roomType) => sum + roomType.capacity * roomType.rooms,
      0,
    );
    const activeResidents = property.residents.filter(
      (resident) => resident.active,
    ).length;
    const startDate = new Date(property.createdAt);
    const endDate = new Date(startDate.getTime() + 365 * DAY_MS);
    const isPendingRenewal = endDate <= thirtyDaysFromNow;
    const isFrozen = Boolean(property.isFrozen);

    return {
      id: property.id,
      userId: property.userId,
      landlordName: property.name,
      inchargeName: property.inchargeName || "N/A",
      phoneNumber: property.inchargePhone || "N/A",
      city: property.city || "N/A",
      state: property.state || "N/A",
      address: property.addressLine1 || "N/A",
      pincode: property.pincode || "N/A",
      googleUrl: property.mapsLink || "#",
      roomTypes,
      additionalInfo: property.description || "",
      isFrozen: Boolean(property.isFrozen),
      freezeReason: property.freezeReason || null,
      electricity24x7: Boolean(facility?.electricity),
      hotWater: Boolean(facility?.hotWater),
      wifi: Boolean(facility?.wifi),
      acSupport: Boolean(facility?.ac),
      powerBackup: Boolean(facility?.powerBackup),
      lift: Boolean(facility?.lift),
      parking: Boolean(facility?.parking),
      food: Boolean(facility?.food),
      laundry: Boolean(facility?.laundry),
      housekeeping: Boolean(facility?.housekeeping),
      cctv: Boolean(facility?.cctv),
      images: property.photos ?? [],
      createdAt: property.createdAt,
      status: isFrozen
        ? "Frozen"
        : isPendingRenewal
          ? "Pending Renewal"
          : "Active",
      startDate,
      endDate,
      totalCapacity,
      activeResidents,
    };
  });

  const countQuery = db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(properties);
  const countRow = where ? await countQuery.where(where) : await countQuery;

  return { items, total: countRow[0]?.count ?? 0 };
};

const getLandlordAccountStats = async () => {
  const [
    allUsers,
    activeResidentUsers,
    superAdminUsers,
    landlordPropertyUsers,
  ] = await Promise.all([
    db.select({ id: users.id }).from(users),
    db
      .select({ userId: residents.userId })
      .from(residents)
      .where(
        and(eq(residents.active, true), sql`${residents.userId} is not null`),
      ),
    db.select({ userId: superAdmins.userId }).from(superAdmins),
    db.selectDistinct({ userId: properties.userId }).from(properties),
  ]);

  const blockedUserIds = new Set<string>();
  for (const row of activeResidentUsers) {
    if (row.userId) blockedUserIds.add(row.userId);
  }
  for (const row of superAdminUsers) {
    blockedUserIds.add(row.userId);
  }

  const landlordAccountUserIds = allUsers
    .map((row) => row.id)
    .filter((userId) => !blockedUserIds.has(userId));
  const landlordPropertyUserIds = landlordPropertyUsers
    .map((row) => row.userId)
    .filter((userId) => !blockedUserIds.has(userId));

  return {
    totalLandlordAccounts: landlordAccountUserIds.length,
    convertedLandlordAccounts: new Set(landlordPropertyUserIds).size,
  };
};

export const adminRouter = router({
  listQueries: superAdminProcedure
    .input(listQueriesSchema)
    .query(async ({ input }) => {
      const startDate = normalizeStartDate(input?.from);
      const endDate = normalizeEndDate(input?.to);
      const conditions = [];

      if (input?.q) {
        conditions.push(
          sql`(
                    setweight(to_tsvector('english', coalesce(${supportQueries.query}, '')), 'A') ||
                    setweight(to_tsvector('english', coalesce(${supportQueries.landlordName}, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(${supportQueries.inchargeName}, '')), 'C') ||
                    setweight(to_tsvector('english', coalesce(${supportQueries.city}, '')), 'D') ||
                    setweight(to_tsvector('english', coalesce(${supportQueries.address}, '')), 'D')
                ) @@ websearch_to_tsquery('english', ${input.q})`,
        );
      }
      if (startDate) conditions.push(gte(supportQueries.createdAt, startDate));
      if (endDate) conditions.push(lte(supportQueries.createdAt, endDate));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const [items, totalRow] = await Promise.all([
        db.query.supportQueries.findMany({
          where,
          orderBy: desc(supportQueries.createdAt),
          limit,
          offset,
        }),
        (async () => {
          const countQuery = db
            .select({
              count: sql<number>`count(*)::int`,
            })
            .from(supportQueries);
          const rows = where ? await countQuery.where(where) : await countQuery;
          return rows[0]?.count ?? 0;
        })(),
      ]);

      return { items, total: totalRow };
    }),

  deleteQuery: superAdminProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      const deleted = await db
        .delete(supportQueries)
        .where(eq(supportQueries.id, input.id))
        .returning({ id: supportQueries.id });

      if (deleted.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Query not found." });
      }

      return { success: true };
    }),

  listFeedbacks: superAdminProcedure
    .input(listFeedbacksSchema)
    .query(async ({ input }) => {
      const startDate = normalizeStartDate(input?.from);
      const endDate = normalizeEndDate(input?.to);
      const conditions = [];

      if (input?.q) {
        conditions.push(
          sql`(
                    setweight(to_tsvector('english', coalesce(${feedbacks.description}, '')), 'A')
                ) @@ websearch_to_tsquery('english', ${input.q})`,
        );
      }
      if (input?.rating) conditions.push(eq(feedbacks.rating, input.rating));
      if (startDate) conditions.push(gte(feedbacks.createdAt, startDate));
      if (endDate) conditions.push(lte(feedbacks.createdAt, endDate));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;

      const [items, totalRow] = await Promise.all([
        db.query.feedbacks.findMany({
          where,
          orderBy: desc(feedbacks.createdAt),
          limit,
          offset,
        }),
        (async () => {
          const countQuery = db
            .select({
              count: sql<number>`count(*)::int`,
            })
            .from(feedbacks);
          const rows = where ? await countQuery.where(where) : await countQuery;
          return rows[0]?.count ?? 0;
        })(),
      ]);

      return { items, total: totalRow };
    }),

  deleteFeedback: superAdminProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      const deleted = await db
        .delete(feedbacks)
        .where(eq(feedbacks.id, input.id))
        .returning({ id: feedbacks.id });

      if (deleted.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback not found.",
        });
      }

      return { success: true };
    }),

  setLandlordFreeze: superAdminProcedure
    .input(setLandlordFreezeSchema)
    .mutation(async ({ input }) => {
      const updated = await db
        .update(properties)
        .set({
          isFrozen: input.isFrozen,
          freezeReason: input.isFrozen
            ? input.freezeReason || "This account has been frozen by admin."
            : null,
        })
        .where(eq(properties.id, input.id))
        .returning({ id: properties.id, isFrozen: properties.isFrozen });

      if (updated.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Landlord not found.",
        });
      }

      return { success: true, isFrozen: updated[0].isFrozen };
    }),

  listLandlords: superAdminProcedure
    .input(listLandlordsSchema)
    .query(async ({ input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      const now = new Date();
      const pendingCutoff = new Date(now.getTime() - 335 * DAY_MS);

      const [landlordsResult, stats] = await Promise.all([
        getLandlordsForAdmin({
          limit,
          offset,
          q: input?.q?.trim(),
          from: input?.from,
          to: input?.to,
          status: input?.status,
        }),
        getLandlordAccountStats(),
      ]);

      const pendingRenewalsWhere = and(
        sql`${properties.isFrozen} is not true`,
        lte(properties.createdAt, pendingCutoff),
      );

      const totalCapacityQuery = db
        .select({
          totalCapacity: sql<number>`coalesce(sum(
                    case
                        when ${rooms.typeId} is not null then coalesce(${propertyRoomTypes.maxOccupancy}, 1)
                        else 1
                    end
                ), 0)::int`,
        })
        .from(rooms)
        .leftJoin(propertyRoomTypes, eq(rooms.typeId, propertyRoomTypes.id))
        .leftJoin(properties, eq(rooms.propertyId, properties.id));

      const [totalPropertiesRows, pendingRenewalsRows, totalCapacityRows] =
        await Promise.all([
          db
            .select({
              count: sql<number>`count(*)::int`,
            })
            .from(properties),
          db
            .select({
              count: sql<number>`count(*)::int`,
            })
            .from(properties)
            .where(pendingRenewalsWhere),
          totalCapacityQuery,
        ]);
      const totalPropertiesRow = totalPropertiesRows[0];
      const pendingRenewalsRow = pendingRenewalsRows[0];
      const totalCapacityRow = totalCapacityRows[0];

      return {
        landlords: landlordsResult.items,
        stats: {
          ...stats,
          totalPropertiesTotal: totalPropertiesRow?.count ?? 0,
          pendingRenewalsTotal: pendingRenewalsRow?.count ?? 0,
          totalCapacityTotal: totalCapacityRow?.totalCapacity ?? 0,
        },
        total: landlordsResult.total,
      };
    }),

  getDashboardSummary: superAdminProcedure.query(async () => {
    const landlordAccountStats = await getLandlordAccountStats();

    const now = new Date();
    const pendingCutoff = new Date(now.getTime() - 335 * DAY_MS);

    const [totalLandlordsRows, pendingRenewalsRows, totalCapacityRows] =
      await Promise.all([
        db
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(properties),
        db
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(properties)
          .where(
            and(
              sql`${properties.isFrozen} is not true`,
              lte(properties.createdAt, pendingCutoff),
            ),
          ),
        db
          .select({
            totalCapacity: sql<number>`coalesce(sum(
                        case
                            when ${rooms.typeId} is not null then coalesce(${propertyRoomTypes.maxOccupancy}, 1)
                            else 1
                        end
                    ), 0)::int`,
          })
          .from(rooms)
          .leftJoin(propertyRoomTypes, eq(rooms.typeId, propertyRoomTypes.id)),
      ]);
    const totalLandlordsRow = totalLandlordsRows[0];
    const pendingRenewalsRow = pendingRenewalsRows[0];
    const totalCapacityRow = totalCapacityRows[0];

    const totalLandlords = totalLandlordsRow?.count ?? 0;
    const totalCapacity = totalCapacityRow?.totalCapacity ?? 0;
    const pendingRenewals = pendingRenewalsRow?.count ?? 0;
    let totalQueries = 0;
    try {
      const [queriesRow] = await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(supportQueries);
      totalQueries = queriesRow?.count || 0;
    } catch {
      totalQueries = 0;
    }

    let openIssues = 0;
    try {
      const [openIssuesRow] = await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(complaints)
        .where(sql`${complaints.status} <> 'resolved'`);
      openIssues = openIssuesRow?.count || 0;
    } catch {
      openIssues = 0;
    }

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);
    const weekStart = new Date(now.getTime() - 7 * DAY_MS);
    const prevWeekStart = new Date(now.getTime() - 14 * DAY_MS);
    const monthStart = new Date(now.getTime() - 30 * DAY_MS);
    const prevMonthStart = new Date(now.getTime() - 60 * DAY_MS);

    const capacityByProperty = db
      .select({
        propertyId: rooms.propertyId,
        totalCapacity: sql<number>`coalesce(sum(
                    case
                        when ${rooms.typeId} is not null then coalesce(${propertyRoomTypes.maxOccupancy}, 1)
                        else 1
                    end
                ), 0)::int`,
      })
      .from(rooms)
      .leftJoin(propertyRoomTypes, eq(rooms.typeId, propertyRoomTypes.id))
      .groupBy(rooms.propertyId)
      .as("capacityByProperty");

    const activeResidentsByProperty = db
      .select({
        propertyId: residents.propertyId,
        activeResidents: sql<number>`count(*)::int`,
      })
      .from(residents)
      .where(eq(residents.status, "active"))
      .groupBy(residents.propertyId)
      .as("activeResidentsByProperty");

    const [analyticsRows, cityRows] = await Promise.all([
      db
        .select({
          todayPrevious: sql<number>`coalesce(sum(case when ${properties.createdAt} >= ${yesterdayStart} and ${properties.createdAt} < ${todayStart} then 1 else 0 end), 0)::int`,
          todayCurrent: sql<number>`coalesce(sum(case when ${properties.createdAt} >= ${todayStart} and ${properties.createdAt} < ${now} then 1 else 0 end), 0)::int`,
          weekPrevious: sql<number>`coalesce(sum(case when ${properties.createdAt} >= ${prevWeekStart} and ${properties.createdAt} < ${weekStart} then 1 else 0 end), 0)::int`,
          weekCurrent: sql<number>`coalesce(sum(case when ${properties.createdAt} >= ${weekStart} and ${properties.createdAt} < ${now} then 1 else 0 end), 0)::int`,
          monthPrevious: sql<number>`coalesce(sum(case when ${properties.createdAt} >= ${prevMonthStart} and ${properties.createdAt} < ${monthStart} then 1 else 0 end), 0)::int`,
          monthCurrent: sql<number>`coalesce(sum(case when ${properties.createdAt} >= ${monthStart} and ${properties.createdAt} < ${now} then 1 else 0 end), 0)::int`,
        })
        .from(properties),
      db
        .select({
          city: properties.city,
          landlords: sql<number>`count(*)::int`,
          totalCapacity: sql<number>`coalesce(sum(${capacityByProperty.totalCapacity}), 0)::int`,
          activeResidents: sql<number>`coalesce(sum(${activeResidentsByProperty.activeResidents}), 0)::int`,
        })
        .from(properties)
        .leftJoin(
          capacityByProperty,
          eq(capacityByProperty.propertyId, properties.id),
        )
        .leftJoin(
          activeResidentsByProperty,
          eq(activeResidentsByProperty.propertyId, properties.id),
        )
        .groupBy(properties.city),
    ]);
    const analyticsRow = analyticsRows[0];

    const landlordAnalytics = {
      today: {
        previous: analyticsRow?.todayPrevious ?? 0,
        current: analyticsRow?.todayCurrent ?? 0,
      },
      week: {
        previous: analyticsRow?.weekPrevious ?? 0,
        current: analyticsRow?.weekCurrent ?? 0,
      },
      month: {
        previous: analyticsRow?.monthPrevious ?? 0,
        current: analyticsRow?.monthCurrent ?? 0,
      },
    };

    const cityDistribution = (cityRows ?? [])
      .map((row) => {
        const name = row.city || "Unknown";
        const occupancy =
          row.totalCapacity > 0
            ? `${Math.min(100, Math.round((row.activeResidents / row.totalCapacity) * 100))}%`
            : "0%";
        return {
          name,
          landlords: row.landlords,
          capacity: row.totalCapacity,
          occupancy,
          revenue: "N/A",
        };
      })
      .sort((a, b) => b.landlords - a.landlords)
      .slice(0, 10);

    return {
      summary: {
        totalLandlords,
        totalLandlordAccounts: landlordAccountStats.totalLandlordAccounts,
        pendingRenewals,
        totalQueries,
        openIssues,
        totalCapacity,
      },
      landlordAnalytics,
      cityDistribution,
    };
  }),

  getMomAnalytics: superAdminProcedure.query(async () => {
    const now = new Date();
    const months = getLastTwelveMonths(now);
    const windowStart = new Date(months[0].year, months[0].month - 1, 1);

    const landlordRows = await db
      .select({
        createdAt: properties.createdAt,
      })
      .from(properties)
      .where(gte(properties.createdAt, windowStart));

    const userRows = await db
      .select({
        createdAt: users.createdAt,
      })
      .from(users)
      .where(gte(users.createdAt, windowStart));

    const landlordCountByMonth = new Map<string, number>();
    for (const row of landlordRows) {
      const month = row.createdAt.getMonth() + 1;
      const year = row.createdAt.getFullYear();
      const key = `${year}-${month}`;
      landlordCountByMonth.set(key, (landlordCountByMonth.get(key) || 0) + 1);
    }

    const userCountByMonth = new Map<string, number>();
    for (const row of userRows) {
      const month = row.createdAt.getMonth() + 1;
      const year = row.createdAt.getFullYear();
      const key = `${year}-${month}`;
      userCountByMonth.set(key, (userCountByMonth.get(key) || 0) + 1);
    }

    const landlordSeries = months.map((item) => ({
      month: item.label,
      stat: landlordCountByMonth.get(item.key) || 0,
    }));

    const userSeries = months.map((item) => ({
      month: item.label,
      stat: userCountByMonth.get(item.key) || 0,
    }));

    return {
      landlords: landlordSeries,
      users: userSeries,
      description: `${months[0].label} ${months[0].year} - ${months[months.length - 1].label} ${months[months.length - 1].year}`,
    };
  }),

  submitLandlordQuery: protectedProcedure
    .input(submitLandlordQuerySchema)
    .mutation(async ({ input, ctx }) => {
      const landlordProperty = await db.query.properties.findFirst({
        where: eq(properties.userId, ctx.user.id),
      });

      if (!landlordProperty) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only landlord accounts can submit queries from this endpoint.",
        });
      }

      const [created] = await db
        .insert(supportQueries)
        .values({
          id: crypto.randomUUID(),
          userId: ctx.user.id,
          propertyId: landlordProperty.id,
          landlordName: landlordProperty.name,
          inchargeName: landlordProperty.inchargeName,
          phoneNumber: landlordProperty.inchargePhone,
          city: landlordProperty.city,
          state: landlordProperty.state,
          pincode: landlordProperty.pincode,
          address: landlordProperty.addressLine1,
          googleUrl: landlordProperty.mapsLink,
          query: input.query,
        })
        .returning();

      return created;
    }),

  listMyLandlordQueries: protectedProcedure.query(async ({ ctx }) => {
    return db.query.supportQueries.findMany({
      where: eq(supportQueries.userId, ctx.user.id),
      orderBy: desc(supportQueries.createdAt),
      limit: 200,
    });
  }),

  deleteMyLandlordQuery: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input, ctx }) => {
      const deleted = await db
        .delete(supportQueries)
        .where(
          and(
            eq(supportQueries.id, input.id),
            eq(supportQueries.userId, ctx.user.id),
          ),
        )
        .returning({ id: supportQueries.id });

      if (deleted.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Query not found.",
        });
      }

      return { success: true };
    }),

  submitFeedback: publicProcedure
    .input(submitFeedbackSchema)
    .mutation(async ({ input }) => {
      const [created] = await db
        .insert(feedbacks)
        .values({
          id: crypto.randomUUID(),
          userId: null,
          rating: input.rating,
          description: input.description || "",
        })
        .returning();

      return created;
    }),
});
