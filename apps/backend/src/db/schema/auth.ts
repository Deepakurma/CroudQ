import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

import { videos, youtubeAccounts } from "./youtube";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", {
      withTimezone: true,
    }),
    deletionRequestedAt: timestamp("deletion_requested_at", {
      withTimezone: true,
    }),
    scheduledDeletionAt: timestamp("scheduled_deletion_at", {
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
    emailLowerUniqueIdx: uniqueIndex("users_email_lower_unique_idx").on(
      sql`lower(${table.email})`,
    ),
  }),
);

export const userCredentials = pgTable("user_credentials", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("password_reset_tokens_token_hash_idx").on(
      table.tokenHash,
    ),
    userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
    expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(
      table.expiresAt,
    ),
  }),
);

export const signupEmailOtps = pgTable(
  "signup_email_otps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: index("signup_email_otps_email_idx").on(table.email),
    codeHashIdx: index("signup_email_otps_code_hash_idx").on(table.codeHash),
    expiresAtIdx: index("signup_email_otps_expires_at_idx").on(table.expiresAt),
  }),
);

export const revokedTokens = pgTable("revoked_tokens", {
  jti: text("jti").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    accessExpiresAt: timestamp("access_expires_at", {
      withTimezone: true,
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    refreshRevokedAt: timestamp("refresh_revoked_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("auth_sessions_token_hash_idx").on(table.tokenHash),
    userIdIdx: index("auth_sessions_user_id_idx").on(table.userId),
    expiresAtIdx: index("auth_sessions_expires_at_idx").on(table.expiresAt),
  }),
);

export const oauthStates = pgTable(
  "oauth_states",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    provider: text("provider").notNull(),
    tokenHash: text("token_hash").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    redirectTo: text("redirect_to"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    oauthStateTokenHashIdx: uniqueIndex("oauth_states_token_hash_idx").on(
      table.tokenHash,
    ),
    userIdIdx: index("oauth_states_user_id_idx").on(table.userId),
    expiresAtIdx: index("oauth_states_expires_at_idx").on(table.expiresAt),
  }),
);

export const webLoginTokens = pgTable(
  "web_login_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    redirectPath: text("redirect_path").default("/pricing").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("web_login_tokens_token_hash_idx").on(
      table.tokenHash,
    ),
    userIdIdx: index("web_login_tokens_user_id_idx").on(table.userId),
    expiresAtIdx: index("web_login_tokens_expires_at_idx").on(table.expiresAt),
  }),
);

export const authRateLimits = pgTable(
  "auth_rate_limits",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    identifier: text("identifier").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    expiresAtIdx: index("auth_rate_limits_expires_at_idx").on(table.expiresAt),
  }),
);

export const usersRelations = relations(users, ({ one, many }) => ({
  credentials: one(userCredentials, {
    fields: [users.id],
    references: [userCredentials.userId],
  }),
  authSessions: many(authSessions),
  passwordResetTokens: many(passwordResetTokens),
  oauthStates: many(oauthStates),
  webLoginTokens: many(webLoginTokens),
  youtubeAccount: one(youtubeAccounts, {
    fields: [users.id],
    references: [youtubeAccounts.userId],
  }),
  videos: many(videos),
}));

export const userCredentialsRelations = relations(userCredentials, ({ one }) => ({
  user: one(users, {
    fields: [userCredentials.userId],
    references: [users.id],
  }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  }),
);

export const oauthStatesRelations = relations(oauthStates, ({ one }) => ({
  user: one(users, {
    fields: [oauthStates.userId],
    references: [users.id],
  }),
}));

export const webLoginTokensRelations = relations(webLoginTokens, ({ one }) => ({
  user: one(users, {
    fields: [webLoginTokens.userId],
    references: [users.id],
  }),
}));
