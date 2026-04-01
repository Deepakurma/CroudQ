import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./auth";

export const billingPlans = pgTable(
  "billing_plans",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    currency: text("currency").notNull().default("INR"),
    amount: integer("amount").notNull(),
    interval: integer("interval").notNull().default(1),
    period: text("period").notNull(),
    totalCount: integer("total_count").notNull(),
    tier: text("tier").notNull().default("CroudQ Pro"),
    provider: text("provider").notNull().default("razorpay"),
    providerPlanId: text("provider_plan_id"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("billing_plans_code_idx").on(table.code),
    providerPlanIdIdx: uniqueIndex("billing_plans_provider_plan_id_idx").on(
      table.providerPlanId,
    ),
  }),
);

export const billingSubscriptions = pgTable(
  "billing_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: text("plan_id")
      .notNull()
      .references(() => billingPlans.id, { onDelete: "restrict" }),
    provider: text("provider").notNull().default("razorpay"),
    providerSubscriptionId: text("provider_subscription_id").notNull(),
    providerPlanId: text("provider_plan_id"),
    providerCustomerId: text("provider_customer_id"),
    status: text("status").notNull(),
    paymentId: text("payment_id"),
    latestInvoiceId: text("latest_invoice_id"),
    shortUrl: text("short_url"),
    cancelAtCycleEnd: boolean("cancel_at_cycle_end").notNull().default(false),
    quantity: integer("quantity").notNull().default(1),
    totalCount: integer("total_count"),
    paidCount: integer("paid_count"),
    remainingCount: integer("remaining_count"),
    currentStart: timestamp("current_start", { withTimezone: true }),
    currentEnd: timestamp("current_end", { withTimezone: true }),
    chargeAt: timestamp("charge_at", { withTimezone: true }),
    startAt: timestamp("start_at", { withTimezone: true }),
    endAt: timestamp("end_at", { withTimezone: true }),
    expireBy: timestamp("expire_by", { withTimezone: true }),
    authenticatedAt: timestamp("authenticated_at", { withTimezone: true }),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    notesJson: text("notes_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    providerSubscriptionIdIdx: uniqueIndex(
      "billing_subscriptions_provider_subscription_id_idx",
    ).on(table.providerSubscriptionId),
    userIdIdx: index("billing_subscriptions_user_id_idx").on(table.userId),
    statusIdx: index("billing_subscriptions_status_idx").on(table.status),
    planIdIdx: index("billing_subscriptions_plan_id_idx").on(table.planId),
  }),
);

export const billingWebhookEvents = pgTable(
  "billing_webhook_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    provider: text("provider").notNull().default("razorpay"),
    eventType: text("event_type").notNull(),
    payloadHash: text("payload_hash").notNull(),
    providerSubscriptionId: text("provider_subscription_id"),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    payloadJson: text("payload_json").notNull(),
  },
  (table) => ({
    payloadHashIdx: uniqueIndex("billing_webhook_events_payload_hash_idx").on(
      table.payloadHash,
    ),
    providerSubscriptionIdIdx: index(
      "billing_webhook_events_provider_subscription_id_idx",
    ).on(table.providerSubscriptionId),
  }),
);
