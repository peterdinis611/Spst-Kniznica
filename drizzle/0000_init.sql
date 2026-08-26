CREATE TABLE "author" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"bio" text NOT NULL,
	"lifespan" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "author_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "book" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"year" integer NOT NULL,
	"pages" integer NOT NULL,
	"isbn" text NOT NULL,
	"description" text NOT NULL,
	"call_number" text NOT NULL,
	"category_id" text NOT NULL,
	"copies_total" integer DEFAULT 3 NOT NULL,
	"copies_available" integer DEFAULT 3 NOT NULL,
	"publisher" text NOT NULL,
	"language" text DEFAULT 'sk' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"cover_url" text,
	"cover_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_isbn_unique" UNIQUE("isbn")
);
--> statement-breakpoint
CREATE TABLE "book_author" (
	"book_id" text NOT NULL,
	"author_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "book_author_book_id_author_id_pk" PRIMARY KEY("book_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"code" text NOT NULL,
	"accent" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "holding" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" text NOT NULL,
	"inventory_no" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" text NOT NULL,
	"holding_id" text,
	"user_id" text NOT NULL,
	"borrowed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"returned_at" timestamp with time zone,
	"renewal_count" integer DEFAULT 0 NOT NULL,
	"borrower_first_name" text DEFAULT '' NOT NULL,
	"borrower_last_name" text DEFAULT '' NOT NULL,
	"borrower_class" text DEFAULT '' NOT NULL,
	"loan_days" integer DEFAULT 21 NOT NULL,
	"cleared_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"issuer" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text DEFAULT 'reader' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book" ADD CONSTRAINT "book_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_author" ADD CONSTRAINT "book_author_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_author" ADD CONSTRAINT "book_author_author_id_author_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."author"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holding" ADD CONSTRAINT "holding_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan" ADD CONSTRAINT "loan_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan" ADD CONSTRAINT "loan_holding_id_holding_id_fk" FOREIGN KEY ("holding_id") REFERENCES "public"."holding"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan" ADD CONSTRAINT "loan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "author_name_idx" ON "author" USING btree ("name");--> statement-breakpoint
CREATE INDEX "book_categoryId_idx" ON "book" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "book_callNumber_idx" ON "book" USING btree ("call_number");--> statement-breakpoint
CREATE INDEX "book_featured_idx" ON "book" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "book_title_idx" ON "book" USING btree ("title");--> statement-breakpoint
CREATE INDEX "book_author_authorId_idx" ON "book_author" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "category_code_uidx" ON "category" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "holding_inventory_uidx" ON "holding" USING btree ("inventory_no");--> statement-breakpoint
CREATE INDEX "holding_book_status_idx" ON "holding" USING btree ("book_id","status");--> statement-breakpoint
CREATE INDEX "loan_userId_idx" ON "loan" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "loan_bookId_idx" ON "loan" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "loan_holdingId_idx" ON "loan" USING btree ("holding_id");--> statement-breakpoint
CREATE INDEX "loan_user_open_idx" ON "loan" USING btree ("user_id","returned_at");--> statement-breakpoint
CREATE INDEX "loan_book_open_idx" ON "loan" USING btree ("book_id","returned_at");--> statement-breakpoint
CREATE INDEX "loan_dueAt_idx" ON "loan" USING btree ("due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "loan_one_active_uidx" ON "loan" USING btree ("user_id","book_id") WHERE "loan"."returned_at" is null;--> statement-breakpoint
CREATE INDEX "reservation_book_status_idx" ON "reservation" USING btree ("book_id","status");--> statement-breakpoint
CREATE INDEX "reservation_user_status_idx" ON "reservation" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" USING btree ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");