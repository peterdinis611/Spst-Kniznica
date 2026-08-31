ALTER TABLE "reservation" ADD COLUMN "expire_soon_mailed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "class_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "class_digest_mailed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "class_digest_overdue" integer DEFAULT 0 NOT NULL;
