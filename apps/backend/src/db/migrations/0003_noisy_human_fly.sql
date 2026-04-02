ALTER TABLE "auth_sessions" ADD COLUMN "replaced_by_session_id" text;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD COLUMN "replacement_refresh_token_encrypted" text;