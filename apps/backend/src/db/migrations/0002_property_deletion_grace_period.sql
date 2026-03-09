ALTER TABLE "property"
ADD COLUMN IF NOT EXISTS "deletionRequestedAt" timestamp,
ADD COLUMN IF NOT EXISTS "deletionScheduledFor" timestamp;

CREATE INDEX IF NOT EXISTS "properties_deletion_scheduled_for_idx"
ON "property" ("deletionScheduledFor");
