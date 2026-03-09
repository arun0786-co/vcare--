CREATE TYPE "public"."channel" AS ENUM('ONLINE', 'PHONE', 'WALK_IN');--> statement-breakpoint
CREATE TYPE "public"."entry_status" AS ENUM('BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('LINK', 'LEAVE_NOW', 'DELAY');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('ADMIN', 'RECEPTIONIST', 'DOCTOR');--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"grace_minutes" integer DEFAULT 10 NOT NULL,
	"alert_buffer_minutes" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clinics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"specialty" text,
	"slot_minutes" integer DEFAULT 15 NOT NULL,
	"default_consult_minutes" integer DEFAULT 8 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	CONSTRAINT "doctor_schedules_weekday" CHECK (weekday between 0 and 6),
	CONSTRAINT "doctor_schedules_order" CHECK (end_time > start_time)
);
--> statement-breakpoint
CREATE TABLE "doctor_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"date" date NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"expected_start_at" timestamp with time zone,
	"doctor_arrived_at" timestamp with time zone,
	"paused_until" timestamp with time zone,
	"pause_reason" text,
	"public_note" text,
	"closed_at" timestamp with time zone,
	"next_ticket" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "doctor_sessions_doctor_start" UNIQUE("doctor_id","starts_at")
);
--> statement-breakpoint
CREATE TABLE "queue_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"ticket_no" integer NOT NULL,
	"channel" "channel" NOT NULL,
	"status" "entry_status" NOT NULL,
	"patient_name" text NOT NULL,
	"patient_phone" text,
	"scheduled_at" timestamp with time zone,
	"checked_in_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"passed_at" timestamp with time zone,
	"priority_at" timestamp with time zone,
	"priority_reason" text,
	"travel_minutes" smallint,
	"public_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "queue_entries_public_token_unique" UNIQUE("public_token"),
	CONSTRAINT "queue_entries_ticket" UNIQUE("session_id","ticket_no")
);
--> statement-breakpoint
CREATE TABLE "queue_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"entry_id" uuid,
	"type" text NOT NULL,
	"from_status" "entry_status",
	"to_status" "entry_status",
	"actor_kind" text NOT NULL,
	"actor_staff_id" uuid,
	"reason" text,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"dedupe_key" text NOT NULL,
	"to_phone" text NOT NULL,
	"channel" text,
	"body" text NOT NULL,
	"payload" jsonb,
	"status" "notification_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "notifications_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "staff_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "staff_role" NOT NULL,
	CONSTRAINT "staff_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_sessions" ADD CONSTRAINT "doctor_sessions_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_sessions" ADD CONSTRAINT "doctor_sessions_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_session_id_doctor_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."doctor_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_events" ADD CONSTRAINT "queue_events_session_id_doctor_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."doctor_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_events" ADD CONSTRAINT "queue_events_entry_id_queue_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."queue_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_events" ADD CONSTRAINT "queue_events_actor_staff_id_staff_users_id_fk" FOREIGN KEY ("actor_staff_id") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_entry_id_queue_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."queue_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_staff_user_id_staff_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "queue_entries_slot" ON "queue_entries" USING btree ("session_id","scheduled_at") WHERE scheduled_at is not null and status <> 'CANCELLED';--> statement-breakpoint
CREATE UNIQUE INDEX "queue_entries_one_in_consultation" ON "queue_entries" USING btree ("session_id") WHERE status = 'IN_CONSULTATION';--> statement-breakpoint
CREATE INDEX "queue_events_session_time" ON "queue_events" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_status" ON "notifications" USING btree ("status");