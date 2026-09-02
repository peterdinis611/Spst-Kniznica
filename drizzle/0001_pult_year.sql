ALTER TABLE "loan" ADD COLUMN "return_offered_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX "loan_return_offered_idx" ON "loan" USING btree ("return_offered_at");
--> statement-breakpoint
CREATE TABLE "inventory_run" (
	"id" text PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"note" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "holding" ADD COLUMN "last_seen_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "holding" ADD COLUMN "inventory_run_id" text;
--> statement-breakpoint
ALTER TABLE "holding" ADD CONSTRAINT "holding_inventory_run_id_inventory_run_id_fk" FOREIGN KEY ("inventory_run_id") REFERENCES "public"."inventory_run"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "holding_inventory_run_idx" ON "holding" USING btree ("inventory_run_id");
