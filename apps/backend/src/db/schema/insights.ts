import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { users } from "./auth";

export const insightArtifacts = pgTable(
  "insight_artifacts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    status: text("status").default("completed").notNull(),
    payloadJson: jsonb("payload_json").$type<unknown>(),
    analyzedCommentCount: integer("analyzed_comment_count")
      .notNull()
      .default(0),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("insight_artifacts_user_id_idx").on(table.userId),
    latestUniqueIdx: uniqueIndex("insight_artifacts_latest_unique_idx").on(
      table.userId,
    ),
  }),
);

export const insightArtifactsRelations = relations(
  insightArtifacts,
  ({ one }) => ({
    user: one(users, {
      fields: [insightArtifacts.userId],
      references: [users.id],
    }),
  }),
);
