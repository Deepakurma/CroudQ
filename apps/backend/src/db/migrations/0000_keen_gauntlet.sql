CREATE TYPE "public"."complaint_status" AS ENUM('pending', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."resident_join_request_status" AS ENUM('invited', 'submitted', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."resident_status" AS ENUM('active', 'past');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('vacant', 'occupied');--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"phoneNumber" text,
	CONSTRAINT "user_phoneNumber_unique" UNIQUE("phoneNumber")
);
--> statement-breakpoint
CREATE TABLE "otp_rate" (
	"phoneNumber" text PRIMARY KEY NOT NULL,
	"lastSentAt" timestamp,
	"sendCount" integer DEFAULT 0,
	"firstSendAt" timestamp,
	"attempts" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revoked_token" (
	"jti" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "super_admin" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "super_admin_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "property" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"inchargeName" text,
	"inchargePhone" text,
	"type" text,
	"addressLine1" text,
	"city" text,
	"state" text,
	"pincode" text,
	"area" text,
	"mapsLink" text,
	"landmarks" text[],
	"floors" integer,
	"includeGroundFloor" boolean,
	"rules" text[],
	"photos" text[],
	"description" text,
	"isFrozen" boolean DEFAULT false NOT NULL,
	"freezeReason" text,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_facility" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"electricity" boolean DEFAULT false,
	"hotWater" boolean DEFAULT false,
	"wifi" boolean DEFAULT false,
	"ac" boolean DEFAULT false,
	"powerBackup" boolean DEFAULT false,
	"lift" boolean DEFAULT false,
	"parking" boolean DEFAULT false,
	"food" boolean DEFAULT false,
	"laundry" boolean DEFAULT false,
	"housekeeping" boolean DEFAULT false,
	"cctv" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "property_room_type" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"name" text NOT NULL,
	"rentAmount" integer,
	"maxOccupancy" integer,
	CONSTRAINT "property_room_types_rent_amount_non_negative" CHECK ("property_room_type"."rentAmount" IS NULL OR "property_room_type"."rentAmount" >= 0),
	CONSTRAINT "property_room_types_max_occupancy_positive" CHECK ("property_room_type"."maxOccupancy" IS NULL OR "property_room_type"."maxOccupancy" > 0)
);
--> statement-breakpoint
CREATE TABLE "room" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"floorNumber" integer NOT NULL,
	"roomNumber" text NOT NULL,
	"typeId" text,
	"status" "room_status" DEFAULT 'vacant',
	"customRentAmount" integer,
	"ac" boolean DEFAULT false,
	CONSTRAINT "rooms_id_property_id_unique_v2" UNIQUE("id","propertyId")
);
--> statement-breakpoint
CREATE TABLE "resident_join_request" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"roomId" text NOT NULL,
	"createdBy" text NOT NULL,
	"reviewedBy" text,
	"inviteCode" text NOT NULL,
	"inviteExpiresAt" timestamp NOT NULL,
	"status" "resident_join_request_status" DEFAULT 'invited' NOT NULL,
	"submittedName" text,
	"submittedPhoneNumber" text,
	"submittedProfileImage" text,
	"submittedCheckInDate" timestamp,
	"submittedCheckOutDate" timestamp,
	"submittedRentAmount" integer,
	"submittedAdvanceMonths" integer,
	"submittedDurationMonths" integer,
	"submittedAt" timestamp,
	"reviewedAt" timestamp,
	"rejectionReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resident_join_request_inviteCode_unique" UNIQUE("inviteCode"),
	CONSTRAINT "resident_join_requests_submitted_rent_amount_non_negative" CHECK ("resident_join_request"."submittedRentAmount" IS NULL OR "resident_join_request"."submittedRentAmount" >= 0),
	CONSTRAINT "resident_join_requests_submitted_advance_months_non_negative" CHECK ("resident_join_request"."submittedAdvanceMonths" IS NULL OR "resident_join_request"."submittedAdvanceMonths" >= 0),
	CONSTRAINT "resident_join_requests_submitted_duration_months_positive" CHECK ("resident_join_request"."submittedDurationMonths" IS NULL OR "resident_join_request"."submittedDurationMonths" > 0)
);
--> statement-breakpoint
CREATE TABLE "resident_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"residentId" text NOT NULL,
	"propertyId" text NOT NULL,
	"amount" integer NOT NULL,
	"paidAt" timestamp DEFAULT now() NOT NULL,
	"paidForFromDueDate" timestamp NOT NULL,
	"paidForToDueDate" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resident_payments_amount_non_negative" CHECK ("resident_payment"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "resident" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"roomId" text NOT NULL,
	"userId" text,
	"name" text NOT NULL,
	"phoneNumber" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"profileImage" text,
	"checkInDate" timestamp NOT NULL,
	"checkOutDate" timestamp,
	"status" "resident_status" DEFAULT 'active',
	"rentAmount" integer NOT NULL,
	"advanceMonths" integer,
	"nextRentDueDate" timestamp NOT NULL,
	"lastPaymentDate" timestamp,
	"lastPaidForDueDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "residents_id_property_id_unique" UNIQUE("id","propertyId"),
	CONSTRAINT "residents_rent_amount_non_negative" CHECK ("resident"."rentAmount" >= 0),
	CONSTRAINT "residents_advance_months_non_negative" CHECK ("resident"."advanceMonths" IS NULL OR "resident"."advanceMonths" >= 0)
);
--> statement-breakpoint
CREATE TABLE "checkout" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"name" text NOT NULL,
	"phoneNumber" text NOT NULL,
	"profileImage" text,
	"checkInDate" timestamp NOT NULL,
	"checkOutDate" timestamp NOT NULL,
	"roomNumber" text NOT NULL,
	"roomType" text,
	"isAc" boolean DEFAULT false,
	"roomId" text,
	"rentAmount" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checkouts_rent_amount_non_negative" CHECK ("checkout"."rentAmount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "complaint" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"residentId" text,
	"roomId" text,
	"title" text NOT NULL,
	"description" text,
	"status" "complaint_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"rating" integer NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedbacks_rating_between_1_and_5" CHECK ("feedback"."rating" >= 1 AND "feedback"."rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE "notice" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"validFrom" timestamp DEFAULT now() NOT NULL,
	"validUntil" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_query" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"propertyId" text,
	"vendorName" text,
	"inchargeName" text,
	"phoneNumber" text,
	"email" text,
	"city" text,
	"state" text,
	"pincode" text,
	"address" text,
	"googleUrl" text,
	"query" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "revoked_token" ADD CONSTRAINT "revoked_token_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "super_admin" ADD CONSTRAINT "super_admin_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property" ADD CONSTRAINT "property_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_facility" ADD CONSTRAINT "property_facility_propertyId_property_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_room_type" ADD CONSTRAINT "property_room_type_propertyId_property_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_propertyId_property_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_typeId_property_room_type_id_fk" FOREIGN KEY ("typeId") REFERENCES "public"."property_room_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_join_request" ADD CONSTRAINT "resident_join_request_propertyId_property_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_join_request" ADD CONSTRAINT "resident_join_request_roomId_room_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_join_request" ADD CONSTRAINT "resident_join_request_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_join_request" ADD CONSTRAINT "resident_join_request_reviewedBy_user_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_join_request" ADD CONSTRAINT "resident_join_requests_room_property_fk" FOREIGN KEY ("roomId","propertyId") REFERENCES "public"."room"("id","propertyId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_payment" ADD CONSTRAINT "resident_payments_resident_property_fk" FOREIGN KEY ("residentId","propertyId") REFERENCES "public"."resident"("id","propertyId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_payment" ADD CONSTRAINT "resident_payments_property_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident" ADD CONSTRAINT "resident_propertyId_property_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident" ADD CONSTRAINT "resident_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident" ADD CONSTRAINT "residents_room_property_fk" FOREIGN KEY ("roomId","propertyId") REFERENCES "public"."room"("id","propertyId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_propertyId_property_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_propertyId_property_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_residentId_resident_id_fk" FOREIGN KEY ("residentId") REFERENCES "public"."resident"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_roomId_room_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."room"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notice" ADD CONSTRAINT "notice_propertyId_property_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_query" ADD CONSTRAINT "support_query_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_query" ADD CONSTRAINT "support_query_propertyId_property_id_fk" FOREIGN KEY ("propertyId") REFERENCES "public"."property"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "revoked_tokens_user_id_idx" ON "revoked_token" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "revoked_tokens_expires_at_idx" ON "revoked_token" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "properties_user_id_idx" ON "property" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "property_facilities_property_id_idx" ON "property_facility" USING btree ("propertyId");--> statement-breakpoint
CREATE UNIQUE INDEX "property_facilities_property_id_unique" ON "property_facility" USING btree ("propertyId");--> statement-breakpoint
CREATE INDEX "property_room_types_property_id_idx" ON "property_room_type" USING btree ("propertyId");--> statement-breakpoint
CREATE UNIQUE INDEX "property_room_types_property_name_unique" ON "property_room_type" USING btree ("propertyId","name");--> statement-breakpoint
CREATE INDEX "rooms_property_id_idx" ON "room" USING btree ("propertyId");--> statement-breakpoint
CREATE INDEX "rooms_type_id_idx" ON "room" USING btree ("typeId");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_property_room_number_unique_v2" ON "room" USING btree ("propertyId","roomNumber");--> statement-breakpoint
CREATE INDEX "resident_join_requests_property_id_idx" ON "resident_join_request" USING btree ("propertyId");--> statement-breakpoint
CREATE INDEX "resident_join_requests_room_id_idx" ON "resident_join_request" USING btree ("roomId");--> statement-breakpoint
CREATE INDEX "resident_join_requests_status_idx" ON "resident_join_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "resident_join_requests_phone_updated_idx" ON "resident_join_request" USING btree ("submittedPhoneNumber","updatedAt");--> statement-breakpoint
CREATE INDEX "resident_join_requests_invite_expires_at_idx" ON "resident_join_request" USING btree ("inviteExpiresAt");--> statement-breakpoint
CREATE INDEX "resident_join_requests_property_status_submitted_idx" ON "resident_join_request" USING btree ("propertyId","status","submittedAt");--> statement-breakpoint
CREATE INDEX "resident_join_requests_created_by_idx" ON "resident_join_request" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "resident_join_requests_reviewed_by_idx" ON "resident_join_request" USING btree ("reviewedBy");--> statement-breakpoint
CREATE INDEX "resident_join_requests_room_property_idx" ON "resident_join_request" USING btree ("roomId","propertyId");--> statement-breakpoint
CREATE INDEX "resident_payments_resident_id_idx" ON "resident_payment" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "resident_payments_property_id_idx" ON "resident_payment" USING btree ("propertyId");--> statement-breakpoint
CREATE INDEX "resident_payments_resident_paid_at_idx" ON "resident_payment" USING btree ("residentId","paidAt");--> statement-breakpoint
CREATE INDEX "resident_payments_property_paid_at_idx" ON "resident_payment" USING btree ("propertyId","paidAt");--> statement-breakpoint
CREATE INDEX "residents_property_id_idx" ON "resident" USING btree ("propertyId");--> statement-breakpoint
CREATE INDEX "residents_room_id_idx" ON "resident" USING btree ("roomId");--> statement-breakpoint
CREATE INDEX "residents_user_id_idx" ON "resident" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "residents_status_idx" ON "resident" USING btree ("status");--> statement-breakpoint
CREATE INDEX "residents_property_status_created_idx" ON "resident" USING btree ("propertyId","status","createdAt");--> statement-breakpoint
CREATE INDEX "residents_room_property_idx" ON "resident" USING btree ("roomId","propertyId");--> statement-breakpoint
CREATE UNIQUE INDEX "residents_active_user_unique" ON "resident" USING btree ("userId") WHERE "resident"."active" = true;--> statement-breakpoint
CREATE INDEX "checkouts_property_id_idx" ON "checkout" USING btree ("propertyId");--> statement-breakpoint
CREATE INDEX "complaints_property_id_idx" ON "complaint" USING btree ("propertyId");--> statement-breakpoint
CREATE INDEX "complaints_resident_id_idx" ON "complaint" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "complaints_room_id_idx" ON "complaint" USING btree ("roomId");--> statement-breakpoint
CREATE INDEX "complaints_status_idx" ON "complaint" USING btree ("status");--> statement-breakpoint
CREATE INDEX "complaints_property_status_created_idx" ON "complaint" USING btree ("propertyId","status","createdAt");--> statement-breakpoint
CREATE INDEX "feedbacks_user_id_idx" ON "feedback" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "feedbacks_rating_idx" ON "feedback" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "feedbacks_created_at_idx" ON "feedback" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "notices_property_id_idx" ON "notice" USING btree ("propertyId");--> statement-breakpoint
CREATE INDEX "notices_is_active_idx" ON "notice" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "notices_valid_until_idx" ON "notice" USING btree ("validUntil");--> statement-breakpoint
CREATE INDEX "support_queries_user_id_idx" ON "support_query" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "support_queries_property_id_idx" ON "support_query" USING btree ("propertyId");--> statement-breakpoint
CREATE INDEX "support_queries_created_at_idx" ON "support_query" USING btree ("createdAt");