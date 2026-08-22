import { relations, sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

export const category = sqliteTable('category', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	description: text('description').notNull(),
	code: text('code').notNull(),
	accent: text('accent').notNull()
});

export const author = sqliteTable('author', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	bio: text('bio').notNull(),
	lifespan: text('lifespan').notNull(),
	role: text('role').notNull()
});

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
		featured: integer('featured', { mode: 'boolean' }).notNull().default(false)
	},
	(table) => [
		index('book_categoryId_idx').on(table.categoryId),
		index('book_callNumber_idx').on(table.callNumber)
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
			.references(() => author.id, { onDelete: 'cascade' })
	},
	(table) => [
		primaryKey({ columns: [table.bookId, table.authorId] }),
		index('book_author_authorId_idx').on(table.authorId)
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
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		borrowedAt: integer('borrowed_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
		dueAt: integer('due_at', { mode: 'timestamp_ms' }).notNull(),
		returnedAt: integer('returned_at', { mode: 'timestamp_ms' })
	},
	(table) => [
		index('loan_userId_idx').on(table.userId),
		index('loan_bookId_idx').on(table.bookId)
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
	loans: many(loan)
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

export const loanRelations = relations(loan, ({ one }) => ({
	book: one(book, {
		fields: [loan.bookId],
		references: [book.id]
	})
}));

export * from './auth.schema';
