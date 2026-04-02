ALTER TABLE "auth_sessions" ADD COLUMN "access_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD COLUMN "refresh_revoked_at" timestamp with time zone;
