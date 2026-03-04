import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./auth/users";
import { residentJoinRequestStatusEnum, residentStatusEnum } from "./enums";
import { properties, rooms } from "./property";

export const residents = pgTable(
  "resident",
  {
    id: text("id").primaryKey(),
    propertyId: text("propertyId")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    roomId: text("roomId").notNull(),
    userId: text("userId").references(() => users.id),
    name: text("name").notNull(),
    phoneNumber: text("phoneNumber").notNull(),
    active: boolean("active").notNull().default(true),
    profileImage: text("profileImage"),
    checkInDate: timestamp("checkInDate").notNull(),
    checkOutDate: timestamp("checkOutDate"),
    status: residentStatusEnum("status").default("active"),
    rentAmount: integer("rentAmount").notNull(),
    advanceMonths: integer("advanceMonths"),
    nextRentDueDate: timestamp("nextRentDueDate").notNull(),
    lastPaymentDate: timestamp("lastPaymentDate"),
    lastPaidForDueDate: timestamp("lastPaidForDueDate"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    propertyIdIdx: index("residents_property_id_idx").on(table.propertyId),
    roomIdIdx: index("residents_room_id_idx").on(table.roomId),
    userIdIdx: index("residents_user_id_idx").on(table.userId),
    statusIdx: index("residents_status_idx").on(table.status),
    searchGinIdx: sql`CREATE INDEX resident_search_idx ON ${table} USING gin(
      setweight(to_tsvector('english', coalesce(${table.name}, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(${table.phoneNumber}, '')), 'B')
    )`,
    propertyStatusCreatedIdx: index("residents_property_status_created_idx").on(
      table.propertyId,
      table.status,
      table.createdAt,
    ),
    roomPropertyIdx: index("residents_room_property_idx").on(
      table.roomId,
      table.propertyId,
    ),
    activeUserUnique: uniqueIndex("residents_active_user_unique")
      .on(table.userId)
      .where(sql`${table.active} = true`),
    residentIdPropertyUnique: unique("residents_id_property_id_unique").on(
      table.id,
      table.propertyId,
    ),
    rentAmountNonNegativeCheck: check(
      "residents_rent_amount_non_negative",
      sql`${table.rentAmount} >= 0`,
    ),
    advanceMonthsNonNegativeCheck: check(
      "residents_advance_months_non_negative",
      sql`${table.advanceMonths} IS NULL OR ${table.advanceMonths} >= 0`,
    ),
    propertyRoomFk: foreignKey({
      columns: [table.roomId, table.propertyId],
      foreignColumns: [rooms.id, rooms.propertyId],
      name: "residents_room_property_fk",
    }).onDelete("cascade"),
  }),
);

export const residentPayments = pgTable(
  "resident_payment",
  {
    id: text("id").primaryKey(),
    residentId: text("residentId").notNull(),
    propertyId: text("propertyId").notNull(),
    amount: integer("amount").notNull(),
    paidAt: timestamp("paidAt").notNull().defaultNow(),
    paidForFromDueDate: timestamp("paidForFromDueDate").notNull(),
    paidForToDueDate: timestamp("paidForToDueDate").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    residentIdIdx: index("resident_payments_resident_id_idx").on(
      table.residentId,
    ),
    propertyIdIdx: index("resident_payments_property_id_idx").on(
      table.propertyId,
    ),
    residentPaidAtIdx: index("resident_payments_resident_paid_at_idx").on(
      table.residentId,
      table.paidAt,
    ),
    propertyPaidAtIdx: index("resident_payments_property_paid_at_idx").on(
      table.propertyId,
      table.paidAt,
    ),
    amountNonNegativeCheck: check(
      "resident_payments_amount_non_negative",
      sql`${table.amount} >= 0`,
    ),
    residentPropertyFk: foreignKey({
      columns: [table.residentId, table.propertyId],
      foreignColumns: [residents.id, residents.propertyId],
      name: "resident_payments_resident_property_fk",
    }).onDelete("cascade"),
    propertyFk: foreignKey({
      columns: [table.propertyId],
      foreignColumns: [properties.id],
      name: "resident_payments_property_fk",
    }).onDelete("cascade"),
  }),
);

export const residentJoinRequests = pgTable(
  "resident_join_request",
  {
    id: text("id").primaryKey(),
    propertyId: text("propertyId")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    roomId: text("roomId")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    createdBy: text("createdBy")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewedBy: text("reviewedBy").references(() => users.id, {
      onDelete: "set null",
    }),
    inviteCode: text("inviteCode").notNull().unique(),
    inviteExpiresAt: timestamp("inviteExpiresAt").notNull(),
    status: residentJoinRequestStatusEnum("status").notNull().default("invited"),
    submittedName: text("submittedName"),
    submittedPhoneNumber: text("submittedPhoneNumber"),
    submittedProfileImage: text("submittedProfileImage"),
    submittedCheckInDate: timestamp("submittedCheckInDate"),
    submittedCheckOutDate: timestamp("submittedCheckOutDate"),
    submittedRentAmount: integer("submittedRentAmount"),
    submittedAdvanceMonths: integer("submittedAdvanceMonths"),
    submittedDurationMonths: integer("submittedDurationMonths"),
    submittedAt: timestamp("submittedAt"),
    reviewedAt: timestamp("reviewedAt"),
    rejectionReason: text("rejectionReason"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    propertyIdIdx: index("resident_join_requests_property_id_idx").on(
      table.propertyId,
    ),
    roomIdIdx: index("resident_join_requests_room_id_idx").on(table.roomId),
    statusIdx: index("resident_join_requests_status_idx").on(table.status),
    submittedPhoneUpdatedIdx: index(
      "resident_join_requests_phone_updated_idx",
    ).on(table.submittedPhoneNumber, table.updatedAt),
    inviteExpiresAtIdx: index("resident_join_requests_invite_expires_at_idx").on(
      table.inviteExpiresAt,
    ),
    propertyStatusSubmittedIdx: index(
      "resident_join_requests_property_status_submitted_idx",
    ).on(table.propertyId, table.status, table.submittedAt),
    createdByIdx: index("resident_join_requests_created_by_idx").on(
      table.createdBy,
    ),
    reviewedByIdx: index("resident_join_requests_reviewed_by_idx").on(
      table.reviewedBy,
    ),
    roomPropertyIdx: index("resident_join_requests_room_property_idx").on(
      table.roomId,
      table.propertyId,
    ),
    submittedRentAmountNonNegativeCheck: check(
      "resident_join_requests_submitted_rent_amount_non_negative",
      sql`${table.submittedRentAmount} IS NULL OR ${table.submittedRentAmount} >= 0`,
    ),
    submittedAdvanceMonthsNonNegativeCheck: check(
      "resident_join_requests_submitted_advance_months_non_negative",
      sql`${table.submittedAdvanceMonths} IS NULL OR ${table.submittedAdvanceMonths} >= 0`,
    ),
    submittedDurationMonthsPositiveCheck: check(
      "resident_join_requests_submitted_duration_months_positive",
      sql`${table.submittedDurationMonths} IS NULL OR ${table.submittedDurationMonths} > 0`,
    ),
    roomPropertyFk: foreignKey({
      columns: [table.roomId, table.propertyId],
      foreignColumns: [rooms.id, rooms.propertyId],
      name: "resident_join_requests_room_property_fk",
    }).onDelete("cascade"),
  }),
);
