import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./auth/users";
import { roomStatusEnum } from "./enums";

export const properties = pgTable(
  "property",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    inchargeName: text("inchargeName"),
    inchargePhone: text("inchargePhone"),
    type: text("type"),
    addressLine1: text("addressLine1"),
    city: text("city"),
    state: text("state"),
    pincode: text("pincode"),
    area: text("area"),
    mapsLink: text("mapsLink"),
    landmarks: text("landmarks").array(),
    floors: integer("floors"),
    includeGroundFloor: boolean("includeGroundFloor"),
    rules: text("rules").array(),
    photos: text("photos").array(),
    description: text("description"),
    isFrozen: boolean("isFrozen").notNull().default(false),
    freezeReason: text("freezeReason"),
    deletionRequestedAt: timestamp("deletionRequestedAt"),
    deletionScheduledFor: timestamp("deletionScheduledFor"),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("properties_user_id_idx").on(table.userId),
    deletionScheduledForIdx: index("properties_deletion_scheduled_for_idx").on(
      table.deletionScheduledFor,
    ),
    searchGinIdx: sql`CREATE INDEX property_search_idx ON ${table} USING gin(
      setweight(to_tsvector('english', coalesce(${table.name}, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(${table.area}, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(${table.city}, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(${table.addressLine1}, '')), 'D') ||
      setweight(to_tsvector('english', coalesce(${table.type}, '')), 'D')
    )`,
  }),
);

export const propertyFacilities = pgTable(
  "property_facility",
  {
    id: text("id").primaryKey(),
    propertyId: text("propertyId")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    electricity: boolean("electricity").default(false),
    hotWater: boolean("hotWater").default(false),
    wifi: boolean("wifi").default(false),
    ac: boolean("ac").default(false),
    powerBackup: boolean("powerBackup").default(false),
    lift: boolean("lift").default(false),
    parking: boolean("parking").default(false),
    food: boolean("food").default(false),
    laundry: boolean("laundry").default(false),
    housekeeping: boolean("housekeeping").default(false),
    cctv: boolean("cctv").default(false),
  },
  (table) => ({
    propertyIdIdx: index("property_facilities_property_id_idx").on(
      table.propertyId,
    ),
    propertyUnique: uniqueIndex("property_facilities_property_id_unique").on(
      table.propertyId,
    ),
  }),
);

export const propertyRoomTypes = pgTable(
  "property_room_type",
  {
    id: text("id").primaryKey(),
    propertyId: text("propertyId")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    rentAmount: integer("rentAmount"),
    maxOccupancy: integer("maxOccupancy"),
  },
  (table) => ({
    propertyIdIdx: index("property_room_types_property_id_idx").on(
      table.propertyId,
    ),
    propertyNameUnique: uniqueIndex(
      "property_room_types_property_name_unique",
    ).on(table.propertyId, table.name),
    searchGinIdx: sql`CREATE INDEX property_room_type_search_idx ON ${table} USING gin(
      setweight(to_tsvector('english', coalesce(${table.name}, '')), 'A')
    )`,
    rentAmountNonNegativeCheck: check(
      "property_room_types_rent_amount_non_negative",
      sql`${table.rentAmount} IS NULL OR ${table.rentAmount} >= 0`,
    ),
    maxOccupancyPositiveCheck: check(
      "property_room_types_max_occupancy_positive",
      sql`${table.maxOccupancy} IS NULL OR ${table.maxOccupancy} > 0`,
    ),
  }),
);

export const rooms = pgTable(
  "room",
  {
    id: text("id").primaryKey(),
    propertyId: text("propertyId")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    floorNumber: integer("floorNumber").notNull(),
    roomNumber: text("roomNumber").notNull(),
    typeId: text("typeId").references(() => propertyRoomTypes.id),
    status: roomStatusEnum("status").default("vacant"),
    customRentAmount: integer("customRentAmount"),
    ac: boolean("ac").default(false),
  },
  (table) => ({
    propertyIdIdx: index("rooms_property_id_idx").on(table.propertyId),
    typeIdIdx: index("rooms_type_id_idx").on(table.typeId),
    searchGinIdx: sql`CREATE INDEX room_search_idx ON ${table} USING gin(
      setweight(to_tsvector('english', coalesce(${table.roomNumber}, '')), 'A')
    )`,
    propertyRoomNumberUnique: uniqueIndex(
      "rooms_property_room_number_unique_v2",
    ).on(table.propertyId, table.roomNumber),
    roomIdPropertyUnique: unique("rooms_id_property_id_unique_v2").on(
      table.id,
      table.propertyId,
    ),
  }),
);
