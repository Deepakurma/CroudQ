import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { users } from "./auth";
// import { videos } from "./youtube";

export const insightArtifacts = pgTable(
  "insight_artifacts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // videoId: text("video_id")
    //   .notNull()
    //   .references(() => videos.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceHash: text("source_hash").notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    status: text("status").default("completed").notNull(),
    payloadJson: jsonb("payload_json").$type<unknown>(),
    rawInputJson: jsonb("raw_input_json").$type<unknown>().notNull(),
    rawOutputJson: text("raw_output_json"),
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
    // videoIdx: index("insight_artifacts_video_id_idx").on(table.videoId),
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

    // video: one(videos, {
    //   fields: [insightArtifacts.videoId],
    //   references: [videos.id],
    // }),
  }),
);
