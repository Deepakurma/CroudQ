import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const revokedTokens = pgTable(
  "revoked_token",
  {
    jti: text("jti").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("revoked_tokens_user_id_idx").on(table.userId),
    expiresAtIdx: index("revoked_tokens_expires_at_idx").on(table.expiresAt),
  }),
);
