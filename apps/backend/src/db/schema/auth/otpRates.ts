import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const otpRates = pgTable("otp_rate", {
  phoneNumber: text("phoneNumber").primaryKey(),
  lastSentAt: timestamp("lastSentAt"),
  sendCount: integer("sendCount").default(0),
  firstSendAt: timestamp("firstSendAt"),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
