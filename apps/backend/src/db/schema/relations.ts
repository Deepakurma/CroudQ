import { relations } from "drizzle-orm";

import { superAdmins, users } from "./auth";
import { checkouts, complaints, feedbacks, notices, supportQueries } from "./communication";
import { properties, propertyFacilities, propertyRoomTypes, rooms } from "./property";
import {
  residentJoinRequests,
  residentPayments,
  residents,
} from "./resident";

export const complaintsRelations = relations(complaints, ({ one }) => ({
  property: one(properties, {
    fields: [complaints.propertyId],
    references: [properties.id],
  }),
  resident: one(residents, {
    fields: [complaints.residentId],
    references: [residents.id],
  }),
  room: one(rooms, {
    fields: [complaints.roomId],
    references: [rooms.id],
  }),
}));

export const noticesRelations = relations(notices, ({ one }) => ({
  property: one(properties, {
    fields: [notices.propertyId],
    references: [properties.id],
  }),
}));

export const propertiesRelations = relations(properties, ({ many }) => ({
  rooms: many(rooms),
  facilities: many(propertyFacilities),
  roomTypes: many(propertyRoomTypes),
  residents: many(residents),
  residentJoinRequests: many(residentJoinRequests),
  complaints: many(complaints),
  notices: many(notices),
}));

export const residentsRelations = relations(residents, ({ one, many }) => ({
  property: one(properties, {
    fields: [residents.propertyId],
    references: [properties.id],
  }),
  room: one(rooms, {
    fields: [residents.roomId],
    references: [rooms.id],
  }),
  complaints: many(complaints),
  payments: many(residentPayments),
}));

export const residentPaymentsRelations = relations(
  residentPayments,
  ({ one }) => ({
    resident: one(residents, {
      fields: [residentPayments.residentId],
      references: [residents.id],
    }),
    property: one(properties, {
      fields: [residentPayments.propertyId],
      references: [properties.id],
    }),
  }),
);

export const residentJoinRequestsRelations = relations(
  residentJoinRequests,
  ({ one }) => ({
    property: one(properties, {
      fields: [residentJoinRequests.propertyId],
      references: [properties.id],
    }),
    room: one(rooms, {
      fields: [residentJoinRequests.roomId],
      references: [rooms.id],
    }),
    createdByUser: one(users, {
      fields: [residentJoinRequests.createdBy],
      references: [users.id],
    }),
    reviewedByUser: one(users, {
      fields: [residentJoinRequests.reviewedBy],
      references: [users.id],
    }),
  }),
);

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  property: one(properties, {
    fields: [rooms.propertyId],
    references: [properties.id],
  }),
  type: one(propertyRoomTypes, {
    fields: [rooms.typeId],
    references: [propertyRoomTypes.id],
  }),
  residents: many(residents),
  residentJoinRequests: many(residentJoinRequests),
  complaints: many(complaints),
}));

export const propertyRoomTypesRelations = relations(
  propertyRoomTypes,
  ({ one }) => ({
    property: one(properties, {
      fields: [propertyRoomTypes.propertyId],
      references: [properties.id],
    }),
  }),
);

export const propertyFacilitiesRelations = relations(
  propertyFacilities,
  ({ one }) => ({
    property: one(properties, {
      fields: [propertyFacilities.propertyId],
      references: [properties.id],
    }),
  }),
);

export const checkoutsRelations = relations(checkouts, ({ one }) => ({
  property: one(properties, {
    fields: [checkouts.propertyId],
    references: [properties.id],
  }),
}));

export const supportQueriesRelations = relations(supportQueries, ({ one }) => ({
  user: one(users, {
    fields: [supportQueries.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [supportQueries.propertyId],
    references: [properties.id],
  }),
}));

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  user: one(users, {
    fields: [feedbacks.userId],
    references: [users.id],
  }),
}));

export const superAdminsRelations = relations(superAdmins, ({ one }) => ({
  user: one(users, {
    fields: [superAdmins.userId],
    references: [users.id],
  }),
}));
