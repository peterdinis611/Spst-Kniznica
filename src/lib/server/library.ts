import { and, asc, count, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from './db';
import { author, book, bookAuthor, category, holding, loan } from './db/schema';
import { ftsBookIds } from './db/catalog-fts';
import {
	getCatalogCache,
	invalidateCatalogCache,
	patchCachedCopies,
	setCatalogCache,
	type CatalogSnapshot
} from './catalog-cache';
import { parseLoanDays } from '$lib/borrow-fields';
import { authorLine } from '$lib/format';
import type { CatalogSearchItem } from '$lib/search';
import type {
	AuthorRecord,
	AuthorSlip,
	BookSlip,
	CatalogBook,
	CategoryChip,
	CategoryRecord,
	BorrowerDraft,
	LoanRecord
} from '$lib/types';

export const MAX_ACTIVE_LOANS: number | null = null;
export const LOAN_DAYS = 21;

export function isLoanLimitReached(activeCount: number) {
	return MAX_ACTIVE_LOANS != null && activeCount >= MAX_ACTIVE_LOANS;
}

type BookRow = {
	book: typeof book.$inferSelect;
	category: typeof category.$inferSelect;
	author: typeof author.$inferSelect | null;
	authorPosition: number | null;
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
				coverUrl: row.book.coverUrl ?? null,
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
				slug: row.author.slug,
				position: row.authorPosition ?? item.authors.length
			});
		}
	}

	for (const item of map.values()) {
		item.authors.sort((a, b) => a.position - b.position);
	}

	return [...map.values()];
}

async function catalog() {
	const hit = getCatalogCache();
	if (hit) return hit;

	const books = assembleBooks(await bookQuery());
	const authors = await loadAuthors();
	const next: CatalogSnapshot = {
		books,
		byId: new Map(books.map((item) => [item.id, item])),
		categories: await loadCategories(),
		authors,
		stats: {
			books: books.length,
			authors: authors.length,
			available: books.reduce((sum, item) => sum + item.copiesAvailable, 0)
		}
	};
	setCatalogCache(next);
	return next;
}

export async function warmCatalog() {
	await catalog();
}

function matchesQuery(item: CatalogBook, query: string) {
	const needle = query.toLowerCase();
	return (
		item.title.toLowerCase().includes(needle) ||
		item.callNumber.toLowerCase().includes(needle) ||
		item.isbn.toLowerCase().includes(needle) ||
		item.authors.some((person) => person.name.toLowerCase().includes(needle))
	);
}

export function toSlip(item: CatalogBook): BookSlip {
	return {
		id: item.id,
		title: item.title,
		callNumber: item.callNumber,
		copiesTotal: item.copiesTotal,
		copiesAvailable: item.copiesAvailable,
		coverUrl: item.coverUrl,
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
		copiesAvailable: item.copiesAvailable,
		coverUrl: item.coverUrl ?? null
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

export async function listBookSlips(query?: string) {
	return (await listBooks(query)).map(toSlip);
}

export async function listAuthorSlips() {
	return (await listAuthors()).map(toAuthorSlip);
}

export async function listCategoryChips() {
	return (await listCategories()).map(toCategoryChip);
}

export async function searchCatalog(query: string, limit = 8) {
	const q = query.trim();
	if (!q) return [];

	const ftsIds = await ftsBookIds(q, limit);
	if (ftsIds.length > 0) {
		const found = await listBooksByIds(ftsIds);
		const rank = new Map(ftsIds.map((id, i) => [id, i]));
		return found
			.sort((a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99))
			.slice(0, limit)
			.map(toSearchItem);
	}

	return (await listBooks(q)).slice(0, limit).map(toSearchItem);
}

async function listBooksByIds(ids: string[]) {
	if (ids.length === 0) return [];
	const { byId } = await catalog();
	return ids.flatMap((id) => {
		const item = byId.get(id);
		return item ? [item] : [];
	});
}

async function bookQuery() {
	return await db
		.select({
			book,
			category,
			author,
			authorPosition: bookAuthor.position
		})
		.from(book)
		.innerJoin(category, eq(book.categoryId, category.id))
		.leftJoin(bookAuthor, eq(bookAuthor.bookId, book.id))
		.leftJoin(author, eq(author.id, bookAuthor.authorId));
}

async function loadCategories() {
	return await db
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
			category.accent,
			category.sortOrder
		)
		.orderBy(asc(category.sortOrder), asc(category.name));
}

async function loadAuthors() {
	return await db
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
		.groupBy(author.id, author.name, author.slug, author.bio, author.lifespan, author.role);
}

export async function listBooks(query?: string) {
	const q = query?.trim();
	const books = (await catalog()).books;
	if (!q) return books;
	return books.filter((item) => matchesQuery(item, q));
}

export async function getBook(id: string) {
	return (await catalog()).byId.get(id);
}

export async function getFeaturedBook() {
	const books = (await catalog()).books;
	const featured = books.find((item) => item.featured && item.id !== 'book-modlitbicky');
	if (featured) return featured;
	return books.find((item) => item.id !== 'book-modlitbicky');
}

export async function listBooksByCategory(slug: string) {
	return (await catalog()).books.filter((item) => item.category.slug === slug);
}

export async function listBookSlipsByCategory(slug: string) {
	return (await listBooksByCategory(slug)).map(toSlip);
}

export async function listBooksByAuthor(slug: string) {
	return (await catalog()).books.filter((item) => item.authors.some((person) => person.slug === slug));
}

export async function listBookSlipsByAuthor(slug: string) {
	return (await listBooksByAuthor(slug)).map(toSlip);
}

export async function relatedBooks(bookId: string, categoryId: string, limit = 4) {
	return (await catalog())
		.books.filter((item) => item.category.id === categoryId && item.id !== bookId)
		.slice(0, limit);
}

export async function relatedBookSlips(bookId: string, categoryId: string, limit = 4) {
	return (await relatedBooks(bookId, categoryId, limit)).map(toSlip);
}

export async function listCategories() {
	return (await catalog()).categories;
}

export async function getCategory(slug: string) {
	return (await listCategories()).find((item) => item.slug === slug);
}

export async function listAuthors() {
	return (await catalog()).authors;
}

export async function getAuthor(slug: string) {
	return (await listAuthors()).find((item) => item.slug === slug);
}

export async function catalogStats() {
	const { stats } = await catalog();
	const openLoans =
		await db.select({ c: count() }).from(loan).where(isNull(loan.returnedAt)).then((rows) => rows[0]?.c ?? 0);

	return { ...stats, openLoans };
}

export async function getActiveLoan(userId: string, bookId: string) {
	return await db
		.select()
		.from(loan)
		.where(and(eq(loan.userId, userId), eq(loan.bookId, bookId), isNull(loan.returnedAt)))
		.then((rows) => rows[0]);
}

export async function countActiveLoans(userId: string) {
	return (
		db
			.select({ c: count() })
			.from(loan)
			.where(and(eq(loan.userId, userId), isNull(loan.returnedAt)))
			.then((rows) => rows[0]?.c ?? 0)
	);
}

export async function listLoans(userId: string): LoanRecord[] {
	const rows = await db
		.select({
			loan,
			book,
			category,
			author,
			authorPosition: bookAuthor.position
		})
		.from(loan)
		.innerJoin(book, eq(loan.bookId, book.id))
		.innerJoin(category, eq(book.categoryId, category.id))
		.leftJoin(bookAuthor, eq(bookAuthor.bookId, book.id))
		.leftJoin(author, eq(author.id, bookAuthor.authorId))
		.where(and(eq(loan.userId, userId), isNull(loan.clearedAt)))
		.orderBy(desc(loan.borrowedAt))
		;

	const booksById = assembleBooks(
		rows.map((row) => ({
			book: row.book,
			category: row.category,
			author: row.author,
			authorPosition: row.authorPosition
		}))
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
			borrowerFirstName: row.loan.borrowerFirstName,
			borrowerLastName: row.loan.borrowerLastName,
			borrowerClass: row.loan.borrowerClass,
			loanDays: row.loan.loanDays,
			book: toSlip(catalogBook)
		});
	}

	return [...loans.values()];
}

export type BorrowResult =
	| { ok: true; dueAt: Date }
	| { ok: false; message: string };

export async function getLastBorrower(userId: string): BorrowerDraft | null {
	const row = await db
		.select({
			firstName: loan.borrowerFirstName,
			lastName: loan.borrowerLastName,
			className: loan.borrowerClass,
			days: loan.loanDays
		})
		.from(loan)
		.where(eq(loan.userId, userId))
		.orderBy(desc(loan.borrowedAt))
		.then((rows) => rows[0]);

	if (!row?.firstName || !row.lastName || !row.className) return null;

	const days = parseLoanDays(String(row.days)) ?? 21;
	return {
		firstName: row.firstName,
		lastName: row.lastName,
		className: row.className,
		days
	};
}

export async function borrowBook(userId: string, bookId: string, draft: BorrowerDraft): Promise<BorrowResult> {
	const result = await db.transaction(async (tx) => {
		const current = await tx.select().from(book).where(eq(book.id, bookId)).then((rows) => rows[0]);
		if (!current) return { ok: false, message: 'Kniha v katalógu nie je.' };
		const copy = await tx
			.select()
			.from(holding)
			.where(and(eq(holding.bookId, bookId), eq(holding.status, 'available')))
			.then((rows) => rows[0]);
		if (!copy || current.copiesAvailable < 1) {
			return { ok: false, message: 'Žiadny voľný výtlačok. Skúste neskôr.' };
		}

		const already = await tx
			.select()
			.from(loan)
			.where(and(eq(loan.userId, userId), eq(loan.bookId, bookId), isNull(loan.returnedAt)))
			.then((rows) => rows[0]);
		if (already) return { ok: false, message: 'Túto knihu už máte vypožičanú.' };

		if (MAX_ACTIVE_LOANS != null) {
			const active =
				await tx
					.select({ c: count() })
					.from(loan)
					.where(and(eq(loan.userId, userId), isNull(loan.returnedAt)))
					.then((rows) => rows[0]?.c ?? 0);
			if (isLoanLimitReached(active)) {
				return { ok: false, message: `Limit ${MAX_ACTIVE_LOANS} výpožičiek je naplnený.` };
			}
		}

		const now = new Date();
		const days = draft.days;
		const dueAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

		await tx.insert(loan)
			.values({
				bookId,
				holdingId: copy.id,
				userId,
				borrowedAt: now,
				dueAt,
				borrowerFirstName: draft.firstName,
				borrowerLastName: draft.lastName,
				borrowerClass: draft.className,
				loanDays: days
			})
			;

		await tx.update(holding).set({ status: 'loaned' }).where(eq(holding.id, copy.id));

		await tx.update(book)
			.set({ copiesAvailable: Math.max(0, current.copiesAvailable - 1) })
			.where(eq(book.id, bookId))
			;

		return { ok: true as const, dueAt };
	});

	if (result.ok) {
		const cached = getCatalogCache()?.byId.get(bookId);
		const next = Math.max(0, (cached?.copiesAvailable ?? 1) - 1);
		if (!cached || !patchCachedCopies(bookId, next)) invalidateCatalogCache();
	}

	return result;
}

export type ReturnResult = { ok: true } | { ok: false; message: string };

export async function returnBook(userId: string, loanId: string): Promise<ReturnResult> {
	let bookId: string | null = null;
	let copiesAvailable: number | null = null;

	const result = await db.transaction(async (tx) => {
		const current = await tx
			.select()
			.from(loan)
			.where(and(eq(loan.id, loanId), eq(loan.userId, userId)))
			.then((rows) => rows[0]);

		if (!current) return { ok: false, message: 'Výpožička sa nenašla.' };
		if (current.returnedAt) return { ok: false, message: 'Táto kniha je už vrátená.' };

		const held = await tx.select().from(book).where(eq(book.id, current.bookId)).then((rows) => rows[0]);
		if (!held) return { ok: false, message: 'Kniha v katalógu nie je.' };

		await tx.update(loan).set({ returnedAt: new Date() }).where(eq(loan.id, loanId));

		if (current.holdingId) {
			await tx.update(holding).set({ status: 'available' }).where(eq(holding.id, current.holdingId));
		} else {
			const loaned = await tx
				.select()
				.from(holding)
				.where(and(eq(holding.bookId, current.bookId), eq(holding.status, 'loaned')))
				.then((rows) => rows[0]);
			if (loaned) {
				await tx.update(holding).set({ status: 'available' }).where(eq(holding.id, loaned.id));
			}
		}

		const copies = Math.min(held.copiesTotal, held.copiesAvailable + 1);
		await tx.update(book)
			.set({ copiesAvailable: copies })
			.where(eq(book.id, current.bookId))
			;

		bookId = current.bookId;
		copiesAvailable = copies;
		return { ok: true as const };
	});

	if (result.ok && bookId && copiesAvailable !== null) {
		if (!patchCachedCopies(bookId, copiesAvailable)) invalidateCatalogCache();
	}

	return result;
}

export async function clearReturnedLoans(userId: string) {
	const result = await db
		.update(loan)
		.set({ clearedAt: new Date() })
		.where(and(eq(loan.userId, userId), isNotNull(loan.returnedAt), isNull(loan.clearedAt)))
		.returning({ id: loan.id });

	return { ok: true as const, cleared: result.length };
}
