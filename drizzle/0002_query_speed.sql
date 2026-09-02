CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE "book_fts" (
	"book_id" text PRIMARY KEY NOT NULL,
	"tsv" tsvector NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_fts" ADD CONSTRAINT "book_fts_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "book_fts_tsv_idx" ON "book_fts" USING gin ("tsv");
--> statement-breakpoint
ALTER TABLE "book" ADD COLUMN "isbn_compact" text GENERATED ALWAYS AS (upper(regexp_replace(isbn, '[^0-9Xx]', '', 'g'))) STORED;
--> statement-breakpoint
CREATE INDEX "book_isbn_compact_idx" ON "book" USING btree ("isbn_compact");
--> statement-breakpoint
CREATE INDEX "book_title_trgm_idx" ON "book" USING gin ("title" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "book_call_trgm_idx" ON "book" USING gin ("call_number" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "book_isbn_trgm_idx" ON "book" USING gin ("isbn" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "author_name_trgm_idx" ON "author" USING gin ("name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "holding_inventory_trgm_idx" ON "holding" USING gin ("inventory_no" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "holding_inventory_lower_idx" ON "holding" USING btree (lower("inventory_no"));
--> statement-breakpoint
CREATE INDEX "holding_available_idx" ON "holding" USING btree ("inventory_run_id") WHERE "status" = 'available';
--> statement-breakpoint
CREATE INDEX "user_name_trgm_idx" ON "user" USING gin ("name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "user_email_trgm_idx" ON "user" USING gin ("email" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "user_created_at_idx" ON "user" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "user_class_name_idx" ON "user" USING btree ("class_name");
--> statement-breakpoint
CREATE INDEX "loan_open_due_idx" ON "loan" USING btree ("due_at") WHERE "returned_at" IS NULL;
--> statement-breakpoint
CREATE INDEX "loan_open_class_idx" ON "loan" USING btree ("borrower_class", "due_at") WHERE "returned_at" IS NULL;
--> statement-breakpoint
CREATE INDEX "loan_inbound_idx" ON "loan" USING btree ("return_offered_at") WHERE "returned_at" IS NULL AND "return_offered_at" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "reservation_fulfilled_expires_idx" ON "reservation" USING btree ("expires_at") WHERE "status" = 'fulfilled';
--> statement-breakpoint
CREATE INDEX "reservation_pending_created_idx" ON "reservation" USING btree ("created_at") WHERE "status" = 'pending';
--> statement-breakpoint
CREATE INDEX "inventory_run_open_idx" ON "inventory_run" USING btree ("started_at") WHERE "closed_at" IS NULL;
--> statement-breakpoint
INSERT INTO "book_fts" ("book_id", "tsv")
SELECT b.id,
	setweight(to_tsvector('simple', coalesce(max(b.title), '')), 'A') ||
	setweight(
		to_tsvector(
			'simple',
			coalesce(max(b.subtitle), '') || ' ' || coalesce(string_agg(a.name, ' ' ORDER BY ba.position), '')
		),
		'B'
	) ||
	setweight(
		to_tsvector(
			'simple',
			coalesce(max(b.description), '') || ' ' ||
			coalesce(max(b.isbn), '') || ' ' ||
			coalesce(max(b.call_number), '') || ' ' ||
			coalesce(max(b.publisher), '')
		),
		'C'
	)
FROM book b
LEFT JOIN book_author ba ON ba.book_id = b.id
LEFT JOIN author a ON a.id = ba.author_id
GROUP BY b.id;
