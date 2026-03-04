import { pgEnum } from "drizzle-orm/pg-core";

export const roomStatusEnum = pgEnum("room_status", [
  "vacant",
  "occupied",
]);

export const residentStatusEnum = pgEnum("resident_status", [
  "active",
  "past",
]);

export const residentJoinRequestStatusEnum = pgEnum("resident_join_request_status", [
  "invited",
  "submitted",
  "approved",
  "rejected",
  "expired",
]);

export const complaintStatusEnum = pgEnum("complaint_status", [
  "pending",
  "resolved",
]);
