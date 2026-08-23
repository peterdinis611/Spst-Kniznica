import { relations, sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const holdingStatus = ['available', 'loaned', 'lost', 'withdrawn'] as const;
export type HoldingStatus = (typeof holdingStatus)[number];

export const reservationStatus = ['pending', 'fulfilled', 'cancelled', 'expired'] as const;
export type ReservationStatus = (typeof reservationStatus)[number];

export const category = sqliteTable(
	'category',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').notNull().unique(),
		description: text('description').notNull(),
		code: text('code').notNull(),
		accent: text('accent').notNull(),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(table) => [uniqueIndex('category_code_uidx').on(table.code)]
);

export const author = sqliteTable(
	'author',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').notNull().unique(),
		bio: text('bio').notNull(),
		lifespan: text('lifespan').notNull(),
		role: text('role').notNull()
	},
	(table) => [index('author_name_idx').on(table.name)]
);

export const book = sqliteTable(
	'book',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		subtitle: text('subtitle'),
		year: integer('year').notNull(),
		pages: integer('pages').notNull(),
		isbn: text('isbn').notNull().unique(),
		description: text('description').notNull(),
		callNumber: text('call_number').notNull(),
		categoryId: text('category_id')
			.notNull()
			.references(() => category.id),
		copiesTotal: integer('copies_total').notNull().default(3),
		copiesAvailable: integer('copies_available').notNull().default(3),
		publisher: text('publisher').notNull(),
		language: text('language').notNull().default('sk'),
		featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs)
	},
	(table) => [
		index('book_categoryId_idx').on(table.categoryId),
		index('book_callNumber_idx').on(table.callNumber),
		index('book_featured_idx').on(table.featured),
		index('book_title_idx').on(table.title)
	]
);

export const bookAuthor = sqliteTable(
	'book_author',
	{
		bookId: text('book_id')
			.notNull()
			.references(() => book.id, { onDelete: 'cascade' }),
		authorId: text('author_id')
			.notNull()
			.references(() => author.id, { onDelete: 'cascade' }),
		position: integer('position').notNull().default(0)
	},
	(table) => [
		primaryKey({ columns: [table.bookId, table.authorId] }),
		index('book_author_authorId_idx').on(table.authorId)
	]
);

export const holding = sqliteTable(
	'holding',
	{
		id: text('id').primaryKey(),
		bookId: text('book_id')
			.notNull()
			.references(() => book.id, { onDelete: 'cascade' }),
		inventoryNo: text('inventory_no').notNull(),
		status: text('status', { enum: holdingStatus }).notNull().default('available'),
		acquiredAt: integer('acquired_at', { mode: 'timestamp_ms' }).notNull().default(nowMs)
	},
	(table) => [
		uniqueIndex('holding_inventory_uidx').on(table.inventoryNo),
		index('holding_book_status_idx').on(table.bookId, table.status)
	]
);

export const loan = sqliteTable(
	'loan',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		bookId: text('book_id')
			.notNull()
			.references(() => book.id),
		holdingId: text('holding_id').references(() => holding.id),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		borrowedAt: integer('borrowed_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
		dueAt: integer('due_at', { mode: 'timestamp_ms' }).notNull(),
		returnedAt: integer('returned_at', { mode: 'timestamp_ms' }),
		renewalCount: integer('renewal_count').notNull().default(0)
	},
	(table) => [
		index('loan_userId_idx').on(table.userId),
		index('loan_bookId_idx').on(table.bookId),
		index('loan_holdingId_idx').on(table.holdingId),
		index('loan_user_open_idx').on(table.userId, table.returnedAt),
		index('loan_book_open_idx').on(table.bookId, table.returnedAt),
		index('loan_dueAt_idx').on(table.dueAt)
	]
);

export const reservation = sqliteTable(
	'reservation',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		bookId: text('book_id')
			.notNull()
			.references(() => book.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		status: text('status', { enum: reservationStatus }).notNull().default('pending')
	},
	(table) => [
		index('reservation_book_status_idx').on(table.bookId, table.status),
		index('reservation_user_status_idx').on(table.userId, table.status)
	]
);

export const categoryRelations = relations(category, ({ many }) => ({
	books: many(book)
}));

export const authorRelations = relations(author, ({ many }) => ({
	bookAuthors: many(bookAuthor)
}));

export const bookRelations = relations(book, ({ one, many }) => ({
	category: one(category, {
		fields: [book.categoryId],
		references: [category.id]
	}),
	bookAuthors: many(bookAuthor),
	holdings: many(holding),
	loans: many(loan),
	reservations: many(reservation)
}));

export const bookAuthorRelations = relations(bookAuthor, ({ one }) => ({
	book: one(book, {
		fields: [bookAuthor.bookId],
		references: [book.id]
	}),
	author: one(author, {
		fields: [bookAuthor.authorId],
		references: [author.id]
	})
}));

export const holdingRelations = relations(holding, ({ one, many }) => ({
	book: one(book, {
		fields: [holding.bookId],
		references: [book.id]
	}),
	loans: many(loan)
}));

export const loanRelations = relations(loan, ({ one }) => ({
	book: one(book, {
		fields: [loan.bookId],
		references: [book.id]
	}),
	holding: one(holding, {
		fields: [loan.holdingId],
		references: [holding.id]
	}),
	user: one(user, {
		fields: [loan.userId],
		references: [user.id]
	})
}));

export const reservationRelations = relations(reservation, ({ one }) => ({
	book: one(book, {
		fields: [reservation.bookId],
		references: [book.id]
	}),
	user: one(user, {
		fields: [reservation.userId],
		references: [user.id]
	})
}));

export * from './auth.schema';
