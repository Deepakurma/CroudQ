CREATE TABLE "signup_email_otps" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password_hash" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "signup_email_otps_email_idx" ON "signup_email_otps" USING btree ("email");--> statement-breakpoint
CREATE INDEX "signup_email_otps_code_hash_idx" ON "signup_email_otps" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "signup_email_otps_expires_at_idx" ON "signup_email_otps" USING btree ("expires_at");