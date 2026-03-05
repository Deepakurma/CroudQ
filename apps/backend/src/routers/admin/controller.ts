import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { db } from "../../db";
import { complaints, feedbacks, properties, residents, superAdmins, supportQueries, users } from "../../db/schema";
import { protectedProcedure, publicProcedure, router, superAdminProcedure } from "../../server/trpc";
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

const countInRange = (dates: Date[], start: Date, end: Date): number => {
    return dates.filter((date) => date >= start && date < end).length;
};

const getLastTwelveMonths = (baseDate: Date): Array<{ key: string; label: string; month: number; year: number }> => {
    const result: Array<{ key: string; label: string; month: number; year: number }> = [];
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

const getLandlordsForAdmin = async (limit: number = 100, offset: number = 0, q?: string) => {
    let filteredPropertyIds: string[] | null = null;
    if (q) {
        const matchedPropertyRows = await db
            .select({ id: properties.id })
            .from(properties)
            .where(
                sql`(
                    setweight(to_tsvector('english', coalesce(${properties.name}, '')), 'A') ||
                    setweight(to_tsvector('english', coalesce(${properties.area}, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(${properties.city}, '')), 'C') ||
                    setweight(to_tsvector('english', coalesce(${properties.addressLine1}, '')), 'D') ||
                    setweight(to_tsvector('english', coalesce(${properties.type}, '')), 'D')
                ) @@ websearch_to_tsquery('english', ${q})`,
            )
            .orderBy(desc(properties.createdAt))
            .limit(limit)
            .offset(offset);
        filteredPropertyIds = matchedPropertyRows.map((row) => row.id);
        if (filteredPropertyIds.length === 0) {
            return [];
        }
    }

    const propertiesData = await db.query.properties.findMany({
        orderBy: desc(properties.createdAt),
        limit: filteredPropertyIds ? undefined : limit,
        offset: filteredPropertyIds ? undefined : offset,
        where: filteredPropertyIds ? inArray(properties.id, filteredPropertyIds) : undefined,
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

    return propertiesData.map((property) => {
        const facility = property.facilities[0];
        const roomCountsByType = new Map<string, number>();
        for (const room of property.rooms) {
            if (!room.typeId) continue;
            roomCountsByType.set(room.typeId, (roomCountsByType.get(room.typeId) || 0) + 1);
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
        const activeResidents = property.residents.filter((resident) => resident.active).length;
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
            thumbnail: property.photos?.[0] || "",
            createdAt: property.createdAt,
            status: isFrozen ? "Frozen" : isPendingRenewal ? "Pending Renewal" : "Active",
            startDate,
            endDate,
            totalCapacity,
            activeResidents,
        };
    });
};

const getLandlordAccountStats = async () => {
    const [allUsers, activeResidentUsers, superAdminUsers, landlordPropertyUsers] = await Promise.all([
        db.select({ id: users.id }).from(users),
        db
            .select({ userId: residents.userId })
            .from(residents)
            .where(and(eq(residents.active, true), sql`${residents.userId} is not null`)),
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
    listQueries: superAdminProcedure.input(listQueriesSchema).query(async ({ input }) => {
        return db.query.supportQueries.findMany({
            where: input?.q
                ? sql`(
                    setweight(to_tsvector('english', coalesce(${supportQueries.query}, '')), 'A') ||
                    setweight(to_tsvector('english', coalesce(${supportQueries.landlordName}, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(${supportQueries.inchargeName}, '')), 'C') ||
                    setweight(to_tsvector('english', coalesce(${supportQueries.city}, '')), 'D') ||
                    setweight(to_tsvector('english', coalesce(${supportQueries.address}, '')), 'D')
                ) @@ websearch_to_tsquery('english', ${input.q})`
                : undefined,
            orderBy: desc(supportQueries.createdAt),
            limit: input?.limit ?? 200,
        });
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

    listFeedbacks: superAdminProcedure.input(listFeedbacksSchema).query(async ({ input }) => {
        return db.query.feedbacks.findMany({
            where: input?.q
                ? sql`(
                    setweight(to_tsvector('english', coalesce(${feedbacks.description}, '')), 'A')
                ) @@ websearch_to_tsquery('english', ${input.q})`
                : undefined,
            orderBy: desc(feedbacks.createdAt),
            limit: input?.limit ?? 200,
        });
    }),

    deleteFeedback: superAdminProcedure
        .input(idSchema)
        .mutation(async ({ input }) => {
            const deleted = await db
                .delete(feedbacks)
                .where(eq(feedbacks.id, input.id))
                .returning({ id: feedbacks.id });

            if (deleted.length === 0) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found." });
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
                    updatedAt: new Date(),
                })
                .where(eq(properties.id, input.id))
                .returning({ id: properties.id, isFrozen: properties.isFrozen });

            if (updated.length === 0) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Landlord not found." });
            }

            return { success: true, isFrozen: updated[0].isFrozen };
        }),

    listLandlords: superAdminProcedure
        .input(listLandlordsSchema)
        .query(async ({ input }) => {
        const limit = input?.limit ?? 100;
        const offset = input?.offset ?? 0;
        const [landlords, stats] = await Promise.all([
            getLandlordsForAdmin(limit, offset, input?.q?.trim()),
            getLandlordAccountStats(),
        ]);
        return {
            landlords,
            stats,
        };
    }),

    getDashboardSummary: superAdminProcedure.query(async () => {
        const landlords = await getLandlordsForAdmin(200, 0);

        const now = new Date();
        const landlordCreatedDates = landlords.map((landlord) => landlord.createdAt);

        const totalCapacity = landlords.reduce((sum, landlord) => sum + landlord.totalCapacity, 0);
        const pendingRenewals = landlords.filter((landlord) => landlord.status === "Pending Renewal").length;
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

        const cityMap = new Map<string, { landlords: number; totalCapacity: number; activeResidents: number }>();
        for (const landlord of landlords) {
            const city = landlord.city || "Unknown";
            const current = cityMap.get(city) || { landlords: 0, totalCapacity: 0, activeResidents: 0 };
            current.landlords += 1;
            current.totalCapacity += landlord.totalCapacity;
            current.activeResidents += landlord.activeResidents;
            cityMap.set(city, current);
        }

        const cityDistribution = Array.from(cityMap.entries())
            .map(([name, value]) => {
                const occupancy = value.totalCapacity > 0
                    ? `${Math.min(100, Math.round((value.activeResidents / value.totalCapacity) * 100))}%`
                    : "0%";
                return {
                    name,
                    landlords: value.landlords,
                    capacity: value.totalCapacity,
                    occupancy,
                    revenue: "N/A",
                };
            })
            .sort((a, b) => b.landlords - a.landlords)
            .slice(0, 10);

        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);
        const weekStart = new Date(now.getTime() - 7 * DAY_MS);
        const prevWeekStart = new Date(now.getTime() - 14 * DAY_MS);
        const monthStart = new Date(now.getTime() - 30 * DAY_MS);
        const prevMonthStart = new Date(now.getTime() - 60 * DAY_MS);

        const landlordAnalytics = {
            today: {
                previous: countInRange(landlordCreatedDates, yesterdayStart, todayStart),
                current: countInRange(landlordCreatedDates, todayStart, now),
            },
            week: {
                previous: countInRange(landlordCreatedDates, prevWeekStart, weekStart),
                current: countInRange(landlordCreatedDates, weekStart, now),
            },
            month: {
                previous: countInRange(landlordCreatedDates, prevMonthStart, monthStart),
                current: countInRange(landlordCreatedDates, monthStart, now),
            },
        };

        return {
            summary: {
                totalLandlords: landlords.length,
                pendingRenewals,
                totalQueries,
                openIssues,
                totalCapacity,
            },
            landlordAnalytics,
            cityDistribution,
            landlords,
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
                    message: "Only landlord accounts can submit queries from this endpoint.",
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
                    updatedAt: new Date(),
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
                    updatedAt: new Date(),
                })
                .returning();

            return created;
        }),
});
