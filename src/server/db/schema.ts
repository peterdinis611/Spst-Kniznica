import { relations, sql } from 'drizzle-orm';
import {
	boolean,
	customType,
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

const tsvector = customType<{ data: string }>({
	dataType() {
		return 'tsvector';
	}
});

export const holdingStatus = ['available', 'loaned', 'lost', 'withdrawn'] as const;
export type HoldingStatus = (typeof holdingStatus)[number];

export const reservationStatus = ['pending', 'fulfilled', 'cancelled', 'expired'] as const;
export type ReservationStatus = (typeof reservationStatus)[number];

export const category = pgTable(
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

export const author = pgTable(
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

export const book = pgTable(
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
		featured: boolean('featured').notNull().default(false),
		coverUrl: text('cover_url'),
		coverKey: text('cover_key'),
		isbnCompact: text('isbn_compact').generatedAlwaysAs(
			sql`upper(regexp_replace(isbn, '[^0-9Xx]', '', 'g'))`
		),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('book_categoryId_idx').on(table.categoryId),
		index('book_callNumber_idx').on(table.callNumber),
		index('book_featured_idx').on(table.featured),
		index('book_title_idx').on(table.title),
		index('book_isbn_compact_idx').on(table.isbnCompact)
	]
);

export const bookAuthor = pgTable(
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

export const bookFts = pgTable(
	'book_fts',
	{
		bookId: text('book_id')
			.primaryKey()
			.references(() => book.id, { onDelete: 'cascade' }),
		tsv: tsvector('tsv').notNull()
	},
	(table) => [index('book_fts_tsv_idx').using('gin', table.tsv)]
);

export const inventoryRun = pgTable('inventory_run', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	closedAt: timestamp('closed_at', { withTimezone: true, mode: 'date' }),
	note: text('note').notNull().default('')
});

export const holding = pgTable(
	'holding',
	{
		id: text('id').primaryKey(),
		bookId: text('book_id')
			.notNull()
			.references(() => book.id, { onDelete: 'cascade' }),
		inventoryNo: text('inventory_no').notNull(),
		status: text('status', { enum: holdingStatus }).notNull().default('available'),
		acquiredAt: timestamp('acquired_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'date' }),
		inventoryRunId: text('inventory_run_id').references(() => inventoryRun.id)
	},
	(table) => [
		uniqueIndex('holding_inventory_uidx').on(table.inventoryNo),
		index('holding_book_status_idx').on(table.bookId, table.status),
		index('holding_inventory_run_idx').on(table.inventoryRunId)
	]
);

export const loan = pgTable(
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
		borrowedAt: timestamp('borrowed_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		dueAt: timestamp('due_at', { withTimezone: true, mode: 'date' }).notNull(),
		returnedAt: timestamp('returned_at', { withTimezone: true, mode: 'date' }),
		renewalCount: integer('renewal_count').notNull().default(0),
		borrowerFirstName: text('borrower_first_name').notNull().default(''),
		borrowerLastName: text('borrower_last_name').notNull().default(''),
		borrowerClass: text('borrower_class').notNull().default(''),
		loanDays: integer('loan_days').notNull().default(21),
		clearedAt: timestamp('cleared_at', { withTimezone: true, mode: 'date' }),
		dueSoonMailedAt: timestamp('due_soon_mailed_at', { withTimezone: true, mode: 'date' }),
		overdueMailedAt: timestamp('overdue_mailed_at', { withTimezone: true, mode: 'date' }),
		returnOfferedAt: timestamp('return_offered_at', { withTimezone: true, mode: 'date' })
	},
	(table) => [
		index('loan_userId_idx').on(table.userId),
		index('loan_bookId_idx').on(table.bookId),
		index('loan_holdingId_idx').on(table.holdingId),
		index('loan_user_open_idx').on(table.userId, table.returnedAt),
		index('loan_book_open_idx').on(table.bookId, table.returnedAt),
		index('loan_dueAt_idx').on(table.dueAt),
		index('loan_return_offered_idx').on(table.returnOfferedAt),
		uniqueIndex('loan_one_active_uidx')
			.on(table.userId, table.bookId)
			.where(sql`${table.returnedAt} is null`)
	]
);

export const reservation = pgTable(
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
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
		status: text('status', { enum: reservationStatus }).notNull().default('pending'),
		expireSoonMailedAt: timestamp('expire_soon_mailed_at', { withTimezone: true, mode: 'date' })
	},
	(table) => [
		index('reservation_book_status_idx').on(table.bookId, table.status),
		index('reservation_user_status_idx').on(table.userId, table.status),
		uniqueIndex('reservation_one_open_uidx')
			.on(table.userId, table.bookId)
			.where(sql`${table.status} in ('pending', 'fulfilled')`)
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
	loans: many(loan),
	inventoryRun: one(inventoryRun, {
		fields: [holding.inventoryRunId],
		references: [inventoryRun.id]
	})
}));

export const inventoryRunRelations = relations(inventoryRun, ({ many }) => ({
	holdings: many(holding)
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
