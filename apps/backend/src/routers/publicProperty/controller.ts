import { and, asc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { db } from "../../db";
import {
  properties,
  propertyFacilities,
  propertyRoomTypes,
} from "../../db/schema";
import { publicProcedure, router } from "../../server/trpc";
import {
  listLocationsSchema,
  listPublicPropertiesSchema,
  publicPropertyBySlugSchema,
} from "./dto";

const amenityKeys = [
  "electricity",
  "hotWater",
  "wifi",
  "ac",
  "powerBackup",
  "lift",
  "parking",
  "food",
  "laundry",
  "housekeeping",
  "cctv",
] as const;

const normalizePropertyType = (value: string | null | undefined) => {
  const key = (value ?? "").trim().toLowerCase();

  if (key.includes("boys")) return "boys-hostel";
  if (key.includes("girls")) return "girls-hostel";
  if (key.includes("coliv")) return "coliving";
  if (key.includes("pg")) return "pg";

  return "pg";
};

const inferSharingType = (name: string | null, maxOccupancy: number | null) => {
  const normalized = (name ?? "").toLowerCase();

  if (normalized.includes("single") || maxOccupancy === 1) return "single";

  for (let occupancy = 2; occupancy <= 6; occupancy += 1) {
    const keyword = `${occupancy}-sharing`;
    const hasExactKeyword =
      normalized.includes(keyword) ||
      normalized.includes(`${occupancy} sharing`) ||
      normalized.includes(`${occupancy}share`) ||
      normalized.includes(`${occupancy}`);

    if (hasExactKeyword || maxOccupancy === occupancy) {
      return keyword;
    }
  }

  if (normalized.includes("double")) return "2-sharing";
  if (normalized.includes("triple")) return "3-sharing";

  if (typeof maxOccupancy === "number" && maxOccupancy > 1) {
    const bounded = Math.min(Math.max(maxOccupancy, 2), 6);
    return `${bounded}-sharing`;
  }

  return "single";
};

const propertySearchDocument = sql`(
  setweight(to_tsvector('english', coalesce(${properties.name}, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(${properties.area}, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(${properties.city}, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(${properties.addressLine1}, '')), 'D') ||
  setweight(to_tsvector('english', coalesce(${properties.type}, '')), 'D')
)`;

type PublicPropertyCursor = {
  name: string;
  id: string;
};

const DEFAULT_PUBLIC_PROPERTY_PAGE_SIZE = 24;

const encodePublicPropertyCursor = (cursor: PublicPropertyCursor) =>
  Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");

const decodePublicPropertyCursor = (
  value: string | undefined,
): PublicPropertyCursor | null => {
  if (!value) return null;

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as {
      name?: unknown;
      id?: unknown;
    };

    if (
      typeof parsed.name !== "string" ||
      parsed.name.length === 0 ||
      typeof parsed.id !== "string" ||
      parsed.id.length === 0
    ) {
      throw new Error("Invalid cursor payload");
    }

    return {
      name: parsed.name,
      id: parsed.id,
    };
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid pagination cursor.",
    });
  }
};

type PropertyAggregate = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  location: string;
  address: string;
  inchargeName: string;
  phoneNumber: string;
  mapUrl: string;
  landmarks: string[];
  rules: string[];
  images: string[];
  amenities: string[];
  propertyType: string;
  sharingTypes: Array<{
    type: string;
    price: number;
    features: string[];
  }>;
  minPrice: number;
};

const buildAddress = (property: {
  addressLine1: string | null;
  area: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}) => {
  return [
    property.addressLine1,
    property.area,
    property.city,
    property.state,
    property.pincode,
  ]
    .filter(Boolean)
    .join(", ");
};

const aggregateProperties = (
  rows: Array<{
    id: string;
    name: string;
    description: string | null;
    city: string | null;
    area: string | null;
    addressLine1: string | null;
    state: string | null;
    pincode: string | null;
    inchargeName: string | null;
    inchargePhone: string | null;
    mapsLink: string | null;
    landmarks: string[] | null;
    rules: string[] | null;
    photos: string[] | null;
    type: string | null;
    createdAt: Date;
    electricity: boolean | null;
    hotWater: boolean | null;
    wifi: boolean | null;
    ac: boolean | null;
    powerBackup: boolean | null;
    lift: boolean | null;
    parking: boolean | null;
    food: boolean | null;
    laundry: boolean | null;
    housekeeping: boolean | null;
    cctv: boolean | null;
    roomTypeName: string | null;
    rentAmount: number | null;
    maxOccupancy: number | null;
  }>,
) => {
  const map = new Map<string, PropertyAggregate>();

  for (const row of rows) {
    const existing = map.get(row.id);

    if (!existing) {
      const amenities = amenityKeys.filter((key) => row[key]);
      const location = row.city || row.area || "Unknown";
      const description =
        row.description?.trim() ||
        `${row.name} in ${location} with managed facilities and flexible sharing options.`;

      map.set(row.id, {
        id: row.id,
        slug: row.id,
        name: row.name,
        shortDescription: description,
        location,
        address: buildAddress(row),
        inchargeName: row.inchargeName || "N/A",
        phoneNumber: row.inchargePhone || "N/A",
        mapUrl: row.mapsLink || "",
        landmarks: row.landmarks ?? [],
        rules: row.rules ?? [],
        images: (row.photos ?? []).filter(Boolean),
        amenities,
        propertyType: normalizePropertyType(row.type),
        sharingTypes: [],
        minPrice: Number.MAX_SAFE_INTEGER,
      });
    }

    const aggregate = map.get(row.id)!;
    if (row.roomTypeName) {
      const price = row.rentAmount ?? 0;
      const sharingType = inferSharingType(row.roomTypeName, row.maxOccupancy);

      if (
        !aggregate.sharingTypes.some((item) => item.type === row.roomTypeName)
      ) {
        aggregate.sharingTypes.push({
          type: row.roomTypeName,
          price,
          features: [sharingType],
        });
      }
      aggregate.minPrice = Math.min(aggregate.minPrice, price);
    }
  }

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      minPrice: item.minPrice === Number.MAX_SAFE_INTEGER ? 0 : item.minPrice,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const publicPropertyRouter = router({
  list: publicProcedure
    .input(listPublicPropertiesSchema)
    .query(async ({ input }) => {
      const search = input?.search?.trim();
      const location = input?.location?.trim();

      const filters = [];
      filters.push(isNull(properties.deletionScheduledFor));
      if (search) {
        filters.push(
          sql`${propertySearchDocument} @@ websearch_to_tsquery('english', ${search})`,
        );
      }

      if (location) {
        filters.push(
          sql`${propertySearchDocument} @@ websearch_to_tsquery('english', ${location})`,
        );
      }

      if (typeof input?.minPrice === "number") {
        filters.push(gte(propertyRoomTypes.rentAmount, input.minPrice));
      }

      if (typeof input?.maxPrice === "number") {
        filters.push(lte(propertyRoomTypes.rentAmount, input.maxPrice));
      }

      if (input?.propertyType) {
        const typeKeyword =
          input.propertyType === "boys-hostel"
            ? "boys"
            : input.propertyType === "girls-hostel"
              ? "girls"
              : input.propertyType === "coliving"
                ? "coliv"
                : "pg";
        filters.push(
          sql`to_tsvector('english', coalesce(${properties.type}, ''))
              @@ websearch_to_tsquery('english', ${typeKeyword})`,
        );
      }

      const cursor = decodePublicPropertyCursor(input?.cursor);
      const pageSize = input?.limit ?? DEFAULT_PUBLIC_PROPERTY_PAGE_SIZE;

      if (cursor) {
        filters.push(
          sql`(
            ${properties.name} > ${cursor.name}
            OR (${properties.name} = ${cursor.name} AND ${properties.id} > ${cursor.id})
          )`,
        );
      }

      const propertyIdRows = await db
        .select({
          id: properties.id,
          name: properties.name,
        })
        .from(properties)
        .leftJoin(
          propertyRoomTypes,
          eq(propertyRoomTypes.propertyId, properties.id),
        )
        .where(filters.length > 0 ? and(...filters) : undefined)
        .groupBy(properties.id, properties.name)
        .orderBy(asc(properties.name), asc(properties.id))
        .limit(pageSize + 1);

      const hasMore = propertyIdRows.length > pageSize;
      const pageRows = hasMore ? propertyIdRows.slice(0, pageSize) : propertyIdRows;

      const propertyIds = pageRows.map((row) => row.id);
      if (propertyIds.length === 0) {
        return {
          items: [],
          nextCursor: null,
        };
      }

      const rows = await db
        .select({
          id: properties.id,
          name: properties.name,
          description: properties.description,
          city: properties.city,
          area: properties.area,
          addressLine1: properties.addressLine1,
          state: properties.state,
          pincode: properties.pincode,
          inchargeName: properties.inchargeName,
          inchargePhone: properties.inchargePhone,
          mapsLink: properties.mapsLink,
          landmarks: properties.landmarks,
          rules: properties.rules,
          photos: properties.photos,
          type: properties.type,
          createdAt: properties.createdAt,
          electricity: propertyFacilities.electricity,
          hotWater: propertyFacilities.hotWater,
          wifi: propertyFacilities.wifi,
          ac: propertyFacilities.ac,
          powerBackup: propertyFacilities.powerBackup,
          lift: propertyFacilities.lift,
          parking: propertyFacilities.parking,
          food: propertyFacilities.food,
          laundry: propertyFacilities.laundry,
          housekeeping: propertyFacilities.housekeeping,
          cctv: propertyFacilities.cctv,
          roomTypeName: propertyRoomTypes.name,
          rentAmount: propertyRoomTypes.rentAmount,
          maxOccupancy: propertyRoomTypes.maxOccupancy,
        })
        .from(properties)
        .leftJoin(
          propertyFacilities,
          eq(propertyFacilities.propertyId, properties.id),
        )
        .leftJoin(
          propertyRoomTypes,
          eq(propertyRoomTypes.propertyId, properties.id),
        )
        .where(inArray(properties.id, propertyIds))
        .orderBy(asc(properties.name), asc(properties.id));

      const aggregated = aggregateProperties(rows);
      const items = aggregated.filter((item) => {
        if (input?.sharingType) {
          const hasSharing = item.sharingTypes.some((type) =>
            type.features.includes(input.sharingType!),
          );
          if (!hasSharing) return false;
        }

        return true;
      });

      const lastRow = pageRows[pageRows.length - 1];
      const nextCursor =
        hasMore && lastRow
          ? encodePublicPropertyCursor({
              name: lastRow.name,
              id: lastRow.id,
            })
          : null;

      return {
        items,
        nextCursor,
      };
    }),

  bySlug: publicProcedure
    .input(publicPropertyBySlugSchema)
    .query(async ({ input }) => {
      const property = await db.query.properties.findFirst({
        where: and(
          eq(properties.id, input.slug),
          isNull(properties.deletionScheduledFor),
        ),
      });

      if (!property) {
        return null;
      }

      const facilities = await db.query.propertyFacilities.findFirst({
        where: eq(propertyFacilities.propertyId, property.id),
      });

      const roomTypes = await db.query.propertyRoomTypes.findMany({
        where: eq(propertyRoomTypes.propertyId, property.id),
        orderBy: [asc(propertyRoomTypes.rentAmount)],
      });

      const amenities = amenityKeys.filter((key) => facilities?.[key]);

      return {
        id: property.id,
        slug: property.id,
        name: property.name,
        shortDescription:
          property.description?.trim() ||
          `${property.name} in ${property.city || property.area || "prime location"}.`,
        location: property.city || property.area || "Unknown",
        address: buildAddress(property),
        inchargeName: property.inchargeName || "N/A",
        phoneNumber: property.inchargePhone || "N/A",
        mapUrl: property.mapsLink || "",
        landmarks: property.landmarks ?? [],
        images: (property.photos ?? []).filter(Boolean),
        amenities,
        rules: property.rules ?? [],
        propertyType: normalizePropertyType(property.type),
        sharingTypes: roomTypes.map((type) => ({
          type: type.name,
          price: type.rentAmount || 0,
          features: [inferSharingType(type.name, type.maxOccupancy)],
        })),
      };
    }),

  locations: publicProcedure.input(listLocationsSchema).query(async ({ input }) => {
    const limit = input?.limit ?? 100;
    const normalizedCity = sql<string>`lower(btrim(${properties.city}))`;
    const displayCity = sql<string>`initcap(lower(btrim(${properties.city})))`;

    const rows = await db
      .select({
        city: displayCity,
      })
      .from(properties)
      .where(
        input?.q
          ? and(
              isNull(properties.deletionScheduledFor),
              sql`${properties.city} IS NOT NULL
              AND btrim(${properties.city}) <> ''
              AND to_tsvector('english', coalesce(${properties.city}, ''))
                  @@ websearch_to_tsquery('english', ${input.q})`,
            )
          : and(
              isNull(properties.deletionScheduledFor),
              sql`${properties.city} IS NOT NULL AND btrim(${properties.city}) <> ''`,
            ),
      )
      .groupBy(normalizedCity, displayCity)
      .orderBy(asc(displayCity))
      .limit(limit);

    return rows
      .map((row) => row.city?.trim())
      .filter((value): value is string => Boolean(value));
  }),
});
