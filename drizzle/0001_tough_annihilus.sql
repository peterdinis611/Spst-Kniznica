ALTER TABLE `loan` ADD `borrower_first_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `loan` ADD `borrower_last_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `loan` ADD `borrower_class` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `loan` ADD `loan_days` integer DEFAULT 21 NOT NULL;--> statement-breakpoint
ALTER TABLE `loan` ADD `cleared_at` integer;