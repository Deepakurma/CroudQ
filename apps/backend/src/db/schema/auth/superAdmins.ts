import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const superAdmins = pgTable(
  "super_admin",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
);
