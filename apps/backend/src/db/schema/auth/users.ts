import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  createdAt: timestamp("createdAt").notNull(),
  phoneNumber: text("phoneNumber").unique(),
});
