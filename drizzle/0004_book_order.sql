CREATE TABLE "book_order" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"borrower_first_name" text DEFAULT '' NOT NULL,
	"borrower_last_name" text DEFAULT '' NOT NULL,
	"borrower_class" text DEFAULT '' NOT NULL,
	"loan_days" integer DEFAULT 21 NOT NULL,
	"loan_id" text,
	"message" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"filled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "book_order" ADD CONSTRAINT "book_order_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "book_order" ADD CONSTRAINT "book_order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "book_order" ADD CONSTRAINT "book_order_loan_id_loan_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loan"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "book_order_book_status_idx" ON "book_order" USING btree ("book_id","status");
--> statement-breakpoint
CREATE INDEX "book_order_user_status_idx" ON "book_order" USING btree ("user_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "book_order_one_open_uidx" ON "book_order" USING btree ("user_id","book_id") WHERE "status" in ('queued', 'filling');
