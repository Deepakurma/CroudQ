import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { users } from "./auth";

export const admins = pgTable(
  "admins",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdByAdminId: text("created_by_admin_id"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdUniqueIdx: uniqueIndex("admins_user_id_unique_idx").on(table.userId),
    activeIdx: index("admins_is_active_idx").on(table.isActive),
    createdByIdx: index("admins_created_by_admin_id_idx").on(table.createdByAdminId),
  }),
);
