CREATE TABLE IF NOT EXISTS "rate_bucket" (
	"id" text PRIMARY KEY NOT NULL,
	"hits" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);
