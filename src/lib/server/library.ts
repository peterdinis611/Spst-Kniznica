import { and, count, desc, eq, isNull, like, or, sql } from 'drizzle-orm';
import { db } from './db';
import { author, book, bookAuthor, category, loan } from './db/schema';
import { authorLine } from '$lib/format';
import type { CatalogSearchItem } from '$lib/search';
import type {
	AuthorRecord,
	AuthorSlip,
	BookSlip,
	CatalogBook,
	CategoryChip,
	CategoryRecord,
	LoanRecord
} from '$lib/types';

export const MAX_ACTIVE_LOANS = 5;
export const LOAN_DAYS = 21;

type BookRow = {
	book: typeof book.$inferSelect;
	category: typeof category.$inferSelect;
	author: typeof author.$inferSelect | null;
};

function assembleBooks(rows: BookRow[]): CatalogBook[] {
	const map = new Map<string, CatalogBook>();

	for (const row of rows) {
		let item = map.get(row.book.id);
		if (!item) {
			item = {
				id: row.book.id,
				title: row.book.title,
				subtitle: row.book.subtitle,
				year: row.book.year,
				pages: row.book.pages,
				isbn: row.book.isbn,
				description: row.book.description,
				callNumber: row.book.callNumber,
				copiesTotal: row.book.copiesTotal,
				copiesAvailable: row.book.copiesAvailable,
				publisher: row.book.publisher,
				featured: row.book.featured,
				category: {
					id: row.category.id,
					name: row.category.name,
					slug: row.category.slug,
					code: row.category.code,
					accent: row.category.accent
				},
				authors: []
			};
			map.set(row.book.id, item);
		}

		if (row.author && !item.authors.some((a) => a.id === row.author?.id)) {
			item.authors.push({
				id: row.author.id,
				name: row.author.name,
				slug: row.author.slug
			});
		}
	}

	return [...map.values()];
}

export function toSlip(item: CatalogBook): BookSlip {
	return {
		id: item.id,
		title: item.title,
		callNumber: item.callNumber,
		copiesTotal: item.copiesTotal,
		copiesAvailable: item.copiesAvailable,
		category: item.category,
		authors: item.authors
	};
}

export function toSearchItem(
	item: BookSlip & { isbn?: string; category: BookSlip['category'] | string }
): CatalogSearchItem {
	return {
		id: item.id,
		title: item.title,
		authors: authorLine(item.authors),
		callNumber: item.callNumber,
		category: typeof item.category === 'string' ? item.category : item.category.name,
		isbn: item.isbn ?? '',
		copiesAvailable: item.copiesAvailable
	};
}

export function toAuthorSlip(person: AuthorRecord): AuthorSlip {
	return {
		id: person.id,
		name: person.name,
		slug: person.slug,
		lifespan: person.lifespan,
		role: person.role,
		bookCount: person.bookCount
	};
}

export function toCategoryChip(item: CategoryRecord): CategoryChip {
	return {
		id: item.id,
		name: item.name,
		slug: item.slug,
		code: item.code,
		accent: item.accent,
		bookCount: item.bookCount
	};
}

export function listBookSlips(query?: string): BookSlip[] {
	return listBooks(query).map(toSlip);
}

export function listAuthorSlips(): AuthorSlip[] {
	return listAuthors().map(toAuthorSlip);
}

export function listCategoryChips(): CategoryChip[] {
	return listCategories().map(toCategoryChip);
}

export function searchCatalog(query: string, limit = 8): CatalogSearchItem[] {
	return listBooks(query).slice(0, limit).map(toSearchItem);
}

function bookQuery() {
	return db
		.select({
			book,
			category,
			author
		})
		.from(book)
		.innerJoin(category, eq(book.categoryId, category.id))
		.leftJoin(bookAuthor, eq(bookAuthor.bookId, book.id))
		.leftJoin(author, eq(author.id, bookAuthor.authorId));
}

export function listBooks(query?: string): CatalogBook[] {
	const q = query?.trim();
	const rows = q
		? bookQuery()
				.where(
					or(
						like(book.title, `%${q}%`),
						like(book.callNumber, `%${q}%`),
						like(book.isbn, `%${q}%`),
						like(author.name, `%${q}%`)
					)
				)
				.all()
		: bookQuery().all();

	return assembleBooks(rows);
}

export function getBook(id: string): CatalogBook | undefined {
	const rows = bookQuery().where(eq(book.id, id)).all();
	return assembleBooks(rows)[0];
}

export function getFeaturedBook(): CatalogBook | undefined {
	const featured = assembleBooks(bookQuery().where(eq(book.featured, true)).all()).find(
		(item) => item.id !== 'book-modlitbicky'
	);
	if (featured) return featured;
	return assembleBooks(bookQuery().limit(12).all()).find((item) => item.id !== 'book-modlitbicky');
}

export function listBooksByCategory(slug: string): CatalogBook[] {
	const rows = bookQuery().where(eq(category.slug, slug)).all();
	return assembleBooks(rows);
}

export function listBookSlipsByCategory(slug: string): BookSlip[] {
	return listBooksByCategory(slug).map(toSlip);
}

export function listBooksByAuthor(slug: string): CatalogBook[] {
	const rows = bookQuery().where(eq(author.slug, slug)).all();
	return assembleBooks(rows);
}

export function listBookSlipsByAuthor(slug: string): BookSlip[] {
	return listBooksByAuthor(slug).map(toSlip);
}

export function relatedBooks(bookId: string, categoryId: string, limit = 4): CatalogBook[] {
	const rows = bookQuery().where(eq(book.categoryId, categoryId)).all();
	return assembleBooks(rows)
		.filter((item) => item.id !== bookId)
		.slice(0, limit);
}

export function relatedBookSlips(bookId: string, categoryId: string, limit = 4): BookSlip[] {
	return relatedBooks(bookId, categoryId, limit).map(toSlip);
}

export function listCategories(): CategoryRecord[] {
	const rows = db
		.select({
			id: category.id,
			name: category.name,
			slug: category.slug,
			description: category.description,
			code: category.code,
			accent: category.accent,
			bookCount: count(book.id)
		})
		.from(category)
		.leftJoin(book, eq(book.categoryId, category.id))
		.groupBy(
			category.id,
			category.name,
			category.slug,
			category.description,
			category.code,
			category.accent
		)
		.all();

	return rows;
}

export function getCategory(slug: string): CategoryRecord | undefined {
	return listCategories().find((item) => item.slug === slug);
}

export function listAuthors(): AuthorRecord[] {
	const rows = db
		.select({
			id: author.id,
			name: author.name,
			slug: author.slug,
			bio: author.bio,
			lifespan: author.lifespan,
			role: author.role,
			bookCount: count(bookAuthor.bookId)
		})
		.from(author)
		.leftJoin(bookAuthor, eq(bookAuthor.authorId, author.id))
		.groupBy(author.id, author.name, author.slug, author.bio, author.lifespan, author.role)
		.all();

	return rows;
}

export function getAuthor(slug: string): AuthorRecord | undefined {
	return listAuthors().find((item) => item.slug === slug);
}

export function catalogStats() {
	const books = db.select({ c: count() }).from(book).get()?.c ?? 0;
	const authors = db.select({ c: count() }).from(author).get()?.c ?? 0;
	const available =
		db
			.select({ c: sql<number>`coalesce(sum(${book.copiesAvailable}), 0)` })
			.from(book)
			.get()?.c ?? 0;
	const openLoans =
		db.select({ c: count() }).from(loan).where(isNull(loan.returnedAt)).get()?.c ?? 0;

	return { books, authors, available: Number(available), openLoans };
}

export function getActiveLoan(userId: string, bookId: string) {
	return db
		.select()
		.from(loan)
		.where(and(eq(loan.userId, userId), eq(loan.bookId, bookId), isNull(loan.returnedAt)))
		.get();
}

export function countActiveLoans(userId: string) {
	return (
		db
			.select({ c: count() })
			.from(loan)
			.where(and(eq(loan.userId, userId), isNull(loan.returnedAt)))
			.get()?.c ?? 0
	);
}

export function listLoans(userId: string): LoanRecord[] {
	const rows = db
		.select({
			loan,
			book,
			category,
			author
		})
		.from(loan)
		.innerJoin(book, eq(loan.bookId, book.id))
		.innerJoin(category, eq(book.categoryId, category.id))
		.leftJoin(bookAuthor, eq(bookAuthor.bookId, book.id))
		.leftJoin(author, eq(author.id, bookAuthor.authorId))
		.where(eq(loan.userId, userId))
		.orderBy(desc(loan.borrowedAt))
		.all();

	const booksById = assembleBooks(
		rows.map((row) => ({ book: row.book, category: row.category, author: row.author }))
	);
	const bookMap = new Map(booksById.map((item) => [item.id, item]));
	const loans = new Map<string, LoanRecord>();

	for (const row of rows) {
		if (loans.has(row.loan.id)) continue;
		const catalogBook = bookMap.get(row.book.id);
		if (!catalogBook) continue;
		loans.set(row.loan.id, {
			id: row.loan.id,
			borrowedAt: row.loan.borrowedAt,
			dueAt: row.loan.dueAt,
			returnedAt: row.loan.returnedAt,
			book: toSlip(catalogBook)
		});
	}

	return [...loans.values()];
}

export type BorrowResult =
	| { ok: true; dueAt: Date }
	| { ok: false; message: string };

export function borrowBook(userId: string, bookId: string): BorrowResult {
	return db.transaction((tx) => {
		const current = tx.select().from(book).where(eq(book.id, bookId)).get();
		if (!current) return { ok: false, message: 'Kniha v katalógu nie je.' };
		if (current.copiesAvailable < 1) {
			return { ok: false, message: 'Žiadny voľný výtlačok. Skúste neskôr.' };
		}

		const already = tx
			.select()
			.from(loan)
			.where(and(eq(loan.userId, userId), eq(loan.bookId, bookId), isNull(loan.returnedAt)))
			.get();
		if (already) return { ok: false, message: 'Túto knihu už máte vypožičanú.' };

		const active =
			tx
				.select({ c: count() })
				.from(loan)
				.where(and(eq(loan.userId, userId), isNull(loan.returnedAt)))
				.get()?.c ?? 0;
		if (active >= MAX_ACTIVE_LOANS) {
			return { ok: false, message: `Limit ${MAX_ACTIVE_LOANS} výpožičiek je naplnený.` };
		}

		const now = new Date();
		const dueAt = new Date(now.getTime() + LOAN_DAYS * 24 * 60 * 60 * 1000);

		tx.insert(loan)
			.values({
				bookId,
				userId,
				borrowedAt: now,
				dueAt
			})
			.run();

		tx.update(book)
			.set({ copiesAvailable: current.copiesAvailable - 1 })
			.where(eq(book.id, bookId))
			.run();

		return { ok: true, dueAt };
	});
}

export type ReturnResult = { ok: true } | { ok: false; message: string };

export function returnBook(userId: string, loanId: string): ReturnResult {
	return db.transaction((tx) => {
		const current = tx
			.select()
			.from(loan)
			.where(and(eq(loan.id, loanId), eq(loan.userId, userId)))
			.get();

		if (!current) return { ok: false, message: 'Výpožička sa nenašla.' };
		if (current.returnedAt) return { ok: false, message: 'Táto kniha je už vrátená.' };

		const held = tx.select().from(book).where(eq(book.id, current.bookId)).get();
		if (!held) return { ok: false, message: 'Kniha v katalógu nie je.' };

		tx.update(loan).set({ returnedAt: new Date() }).where(eq(loan.id, loanId)).run();
		tx.update(book)
			.set({ copiesAvailable: held.copiesAvailable + 1 })
			.where(eq(book.id, current.bookId))
			.run();

		return { ok: true };
	});
}
