ALTER TABLE "loan" ADD COLUMN "due_soon_mailed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "loan" ADD COLUMN "overdue_mailed_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "reservation_one_open_uidx" ON "reservation" USING btree ("user_id","book_id") WHERE "reservation"."status" in ('pending', 'fulfilled');
