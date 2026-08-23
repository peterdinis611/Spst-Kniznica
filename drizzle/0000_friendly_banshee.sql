CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`code` text NOT NULL,
	`accent` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_slug_unique` ON `category` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_code_uidx` ON `category` (`code`);--> statement-breakpoint
CREATE TABLE `author` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`bio` text NOT NULL,
	`lifespan` text NOT NULL,
	`role` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `author_slug_unique` ON `author` (`slug`);--> statement-breakpoint
CREATE INDEX `author_name_idx` ON `author` (`name`);--> statement-breakpoint
CREATE TABLE `book` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`year` integer NOT NULL,
	`pages` integer NOT NULL,
	`isbn` text NOT NULL,
	`description` text NOT NULL,
	`call_number` text NOT NULL,
	`category_id` text NOT NULL,
	`copies_total` integer DEFAULT 3 NOT NULL,
	`copies_available` integer DEFAULT 3 NOT NULL,
	`publisher` text NOT NULL,
	`language` text DEFAULT 'sk' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `book_isbn_unique` ON `book` (`isbn`);--> statement-breakpoint
CREATE INDEX `book_categoryId_idx` ON `book` (`category_id`);--> statement-breakpoint
CREATE INDEX `book_callNumber_idx` ON `book` (`call_number`);--> statement-breakpoint
CREATE INDEX `book_featured_idx` ON `book` (`featured`);--> statement-breakpoint
CREATE INDEX `book_title_idx` ON `book` (`title`);--> statement-breakpoint
CREATE TABLE `book_author` (
	`book_id` text NOT NULL,
	`author_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`book_id`, `author_id`),
	FOREIGN KEY (`book_id`) REFERENCES `book`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `author`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `book_author_authorId_idx` ON `book_author` (`author_id`);--> statement-breakpoint
CREATE TABLE `holding` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`inventory_no` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`acquired_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `book`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `holding_inventory_uidx` ON `holding` (`inventory_no`);--> statement-breakpoint
CREATE INDEX `holding_book_status_idx` ON `holding` (`book_id`,`status`);--> statement-breakpoint
CREATE TABLE `loan` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`holding_id` text,
	`user_id` text NOT NULL,
	`borrowed_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`due_at` integer NOT NULL,
	`returned_at` integer,
	`renewal_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `book`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`holding_id`) REFERENCES `holding`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `loan_userId_idx` ON `loan` (`user_id`);--> statement-breakpoint
CREATE INDEX `loan_bookId_idx` ON `loan` (`book_id`);--> statement-breakpoint
CREATE INDEX `loan_holdingId_idx` ON `loan` (`holding_id`);--> statement-breakpoint
CREATE INDEX `loan_user_open_idx` ON `loan` (`user_id`,`returned_at`);--> statement-breakpoint
CREATE INDEX `loan_book_open_idx` ON `loan` (`book_id`,`returned_at`);--> statement-breakpoint
CREATE INDEX `loan_dueAt_idx` ON `loan` (`due_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `loan_one_active_uidx` ON `loan` (`user_id`,`book_id`) WHERE `returned_at` IS NULL;--> statement-breakpoint
CREATE TABLE `reservation` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`expires_at` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `book`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reservation_book_status_idx` ON `reservation` (`book_id`,`status`);--> statement-breakpoint
CREATE INDEX `reservation_user_status_idx` ON `reservation` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`issuer` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_issuer_accountId_uidx` ON `account` (`issuer`,`account_id`);--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE VIRTUAL TABLE `book_fts` USING fts5(
	book_id UNINDEXED,
	title,
	subtitle,
	description,
	isbn,
	call_number,
	publisher,
	authors,
	tokenize = 'unicode61'
);
