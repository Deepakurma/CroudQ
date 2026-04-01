import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { users } from "./auth";

export const youtubeAccounts = pgTable(
  "youtube_accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channelId: text("channel_id").notNull(),
    channelName: text("channel_name"),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdUniqueIdx: uniqueIndex("youtube_accounts_user_id_unique_idx").on(
      table.userId,
    ),
  }),
);

export const videos = pgTable(
  "videos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    youtubeVideoId: text("youtube_video_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    thumbnailUrl: text("thumbnail_url"),
    viewCount: bigint("view_count", { mode: "number" }),
    likeCount: integer("like_count"),
    favoriteCount: integer("favorite_count"),
    commentCount: integer("comment_count"),
    duration: text("duration"),
    lastCommentsSyncedAt: timestamp("last_comments_synced_at", {
      withTimezone: true,
    }),
    lastManualCommentsSyncAt: timestamp("last_manual_comments_sync_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    youtubeVideoIdIdx: uniqueIndex("videos_youtube_video_id_idx").on(
      table.youtubeVideoId,
    ),
    userIdIdx: index("videos_user_id_idx").on(table.userId),
    publishedAtIdx: index("videos_published_at_idx").on(table.publishedAt),
  }),
);

export const comments = pgTable(
  "comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    youtubeCommentId: text("youtube_comment_id").notNull(),
    text: text("text").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    likeCount: integer("like_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    youtubeCommentIdIdx: uniqueIndex("comments_youtube_comment_id_idx").on(
      table.youtubeCommentId,
    ),
    videoIdIdx: index("comments_video_id_idx").on(table.videoId),
    publishedAtIdx: index("comments_published_at_idx").on(table.publishedAt),
  }),
);

export const youtubeAccountsRelations = relations(
  youtubeAccounts,
  ({ one }) => ({
    user: one(users, {
      fields: [youtubeAccounts.userId],
      references: [users.id],
    }),
  }),
);
export const videosRelations = relations(videos, ({ one, many }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  video: one(videos, {
    fields: [comments.videoId],
    references: [videos.id],
  }),
}));
