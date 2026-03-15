import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./auth/users";
import {
  complaintStatusEnum,
} from "./enums";
import { properties, rooms } from "./property";
import { residents } from "./resident";

export const complaints = pgTable(
  "complaint",
  {
    id: text("id").primaryKey(),
    propertyId: text("propertyId")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    residentId: text("residentId").references(() => residents.id, {
      onDelete: "set null",
    }),
    roomId: text("roomId").references(() => rooms.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    status: complaintStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    resolvedAt: timestamp("resolvedAt"),
  },
  (table) => ({
    propertyIdIdx: index("complaints_property_id_idx").on(table.propertyId),
    residentIdIdx: index("complaints_resident_id_idx").on(table.residentId),
    roomIdIdx: index("complaints_room_id_idx").on(table.roomId),
    statusIdx: index("complaints_status_idx").on(table.status),
    searchGinIdx: sql`CREATE INDEX complaint_search_idx ON ${table} USING gin(
      setweight(to_tsvector('english', coalesce(${table.title}, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(${table.description}, '')), 'B')
    )`,
    propertyStatusCreatedIdx: index(
      "complaints_property_status_created_idx",
    ).on(table.propertyId, table.status, table.createdAt),
  }),
);

export const notices = pgTable(
  "notice",
  {
    id: text("id").primaryKey(),
    propertyId: text("propertyId")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    validFrom: timestamp("validFrom").notNull().defaultNow(),
    validUntil: timestamp("validUntil"),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    propertyIdIdx: index("notices_property_id_idx").on(table.propertyId),
    isActiveIdx: index("notices_is_active_idx").on(table.isActive),
    validUntilIdx: index("notices_valid_until_idx").on(table.validUntil),
    searchGinIdx: sql`CREATE INDEX notice_search_idx ON ${table} USING gin(
      setweight(to_tsvector('english', coalesce(${table.title}, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(${table.description}, '')), 'B')
    )`,
  }),
);

export const checkouts = pgTable(
  "checkout",
  {
    id: text("id").primaryKey(),
    propertyId: text("propertyId")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phoneNumber: text("phoneNumber").notNull(),
    profileImage: text("profileImage"),
    checkInDate: timestamp("checkInDate").notNull(),
    checkOutDate: timestamp("checkOutDate").notNull(),
    roomNumber: text("roomNumber").notNull(),
    roomType: text("roomType"),
    isAc: boolean("isAc").default(false),
    roomId: text("roomId"),
    rentAmount: integer("rentAmount").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    propertyIdIdx: index("checkouts_property_id_idx").on(table.propertyId),
    searchGinIdx: sql`CREATE INDEX checkout_search_idx ON ${table} USING gin(
      setweight(to_tsvector('english', coalesce(${table.name}, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(${table.roomNumber}, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(${table.phoneNumber}, '')), 'C')
    )`,
    rentAmountNonNegativeCheck: check(
      "checkouts_rent_amount_non_negative",
      sql`${table.rentAmount} >= 0`,
    ),
  }),
);

export const supportQueries = pgTable(
  "support_query",
  {
    id: text("id").primaryKey(),
    userId: text("userId").references(() => users.id, { onDelete: "set null" }),
    propertyId: text("propertyId").references(() => properties.id, {
      onDelete: "set null",
    }),
    landlordName: text("landlordName"),
    inchargeName: text("inchargeName"),
    phoneNumber: text("phoneNumber"),
    city: text("city"),
    state: text("state"),
    pincode: text("pincode"),
    address: text("address"),
    googleUrl: text("googleUrl"),
    query: text("query").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("support_queries_user_id_idx").on(table.userId),
    propertyIdIdx: index("support_queries_property_id_idx").on(
      table.propertyId,
    ),
    createdAtIdx: index("support_queries_created_at_idx").on(table.createdAt),
    searchGinIdx: sql`CREATE INDEX support_query_search_idx ON ${table} USING gin(
      setweight(to_tsvector('english', coalesce(${table.query}, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(${table.landlordName}, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(${table.inchargeName}, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(${table.city}, '')), 'D') ||
      setweight(to_tsvector('english', coalesce(${table.address}, '')), 'D')
    )`,
  }),
);

export const feedbacks = pgTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    userId: text("userId").references(() => users.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("feedbacks_user_id_idx").on(table.userId),
    ratingIdx: index("feedbacks_rating_idx").on(table.rating),
    createdAtIdx: index("feedbacks_created_at_idx").on(table.createdAt),
    searchGinIdx: sql`CREATE INDEX feedback_search_idx ON ${table} USING gin(
      setweight(to_tsvector('english', coalesce(${table.description}, '')), 'A')
    )`,
    ratingRangeCheck: check(
      "feedbacks_rating_between_1_and_5",
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`,
    ),
  }),
);
