import { and, asc, count, eq, ilike, isNull, or } from 'drizzle-orm';
import { LIST_LIMIT } from '$lib/admin';
import { bookSchema, deskIssue } from '$lib/desk-fields';
import { refreshCatalog } from '../admin';
import { forgetCover, parseCover } from '../cover-files';
import { db } from '../db';
import { book, bookAuthor, category, holding, loan } from '../db/schema';
import { syncCopies } from './copies';
import { caught, fail, needle, newId, ok, type DeskResult } from './shared';

export async function listDeskBooks(query = '') {
	const q = query.trim();
	return await db
		.select({
			id: book.id,
			title: book.title,
			subtitle: book.subtitle,
			year: book.year,
			pages: book.pages,
			isbn: book.isbn,
			description: book.description,
			callNumber: book.callNumber,
			categoryId: book.categoryId,
			categoryName: category.name,
			copiesTotal: book.copiesTotal,
			copiesAvailable: book.copiesAvailable,
			publisher: book.publisher,
			language: book.language,
			featured: book.featured,
			coverUrl: book.coverUrl,
			coverKey: book.coverKey
		})
		.from(book)
		.innerJoin(category, eq(book.categoryId, category.id))
		.where(
			q
				? or(
						ilike(book.title, needle(q)),
						ilike(book.isbn, needle(q)),
						ilike(book.callNumber, needle(q)),
						ilike(book.publisher, needle(q))
					)
				: undefined
		)
		.orderBy(asc(book.title))
		.limit(LIST_LIMIT);
}

export async function getDeskBook(id: string) {
	if (!id) return null;
	return db
		.select({
			id: book.id,
			title: book.title,
			subtitle: book.subtitle,
			year: book.year,
			pages: book.pages,
			isbn: book.isbn,
			description: book.description,
			callNumber: book.callNumber,
			categoryId: book.categoryId,
			categoryName: category.name,
			copiesTotal: book.copiesTotal,
			copiesAvailable: book.copiesAvailable,
			publisher: book.publisher,
			language: book.language,
			featured: book.featured,
			coverUrl: book.coverUrl,
			coverKey: book.coverKey
		})
		.from(book)
		.innerJoin(category, eq(book.categoryId, category.id))
		.where(eq(book.id, id))
		.then((rows) => rows[0] ?? null);
}

export async function bookAuthorIds(bookId: string) {
	return await db
		.select({ authorId: bookAuthor.authorId, position: bookAuthor.position })
		.from(bookAuthor)
		.where(eq(bookAuthor.bookId, bookId))
		.orderBy(asc(bookAuthor.position));
}

export async function saveBook(input: {
	id?: string;
	title: string;
	subtitle: string;
	year: number;
	pages: number;
	isbn: string;
	description: string;
	callNumber: string;
	categoryId: string;
	publisher: string;
	language: string;
	featured: boolean;
	authorIds: string[];
	copies?: number;
	coverUrl?: string;
	coverKey?: string;
}): Promise<DeskResult> {
	const title = input.title.trim();
	const isbn = input.isbn.trim();
	const callNumber = input.callNumber.trim();
	const description = input.description.trim();
	const publisher = input.publisher.trim();
	const language = (input.language.trim() || 'sk').slice(0, 8);
	const subtitle = input.subtitle.trim() || null;
	const issue = deskIssue(bookSchema, {
		title,
		subtitle: input.subtitle,
		isbn,
		callNumber,
		description,
		publisher,
		categoryId: input.categoryId,
		language,
		year: input.year,
		pages: input.pages,
		copies: input.copies,
		featured: input.featured
	});
	if (issue) return fail(issue);
	const cat = await db
		.select()
		.from(category)
		.where(eq(category.id, input.categoryId))
		.then((rows) => rows[0]);
	if (!cat) return fail('Vyber odbor.');

	const authors = input.authorIds.filter(Boolean);
	const cover = parseCover(input.coverUrl ?? '', input.coverKey ?? '');
	let bookId = input.id ?? '';
	let previousKey: string | null = null;

	try {
		await db.transaction(async (tx) => {
			if (input.id) {
				const current = await tx.select().from(book).where(eq(book.id, input.id)).then((rows) => rows[0]);
				if (!current) throw new Error('Kniha sa nenašla.');
				previousKey = current.coverKey;
				await tx
					.update(book)
					.set({
						title,
						subtitle,
						year: input.year,
						pages: input.pages,
						isbn,
						description,
						callNumber,
						categoryId: input.categoryId,
						publisher,
						language,
						featured: input.featured,
						coverUrl: cover.coverUrl,
						coverKey: cover.coverKey
					})
					.where(eq(book.id, input.id));
				await tx.delete(bookAuthor).where(eq(bookAuthor.bookId, input.id));
				bookId = input.id;
			} else {
				bookId = newId('book', title);
				await tx.insert(book).values({
					id: bookId,
					title,
					subtitle,
					year: input.year,
					pages: input.pages,
					isbn,
					description,
					callNumber,
					categoryId: input.categoryId,
					publisher,
					language,
					featured: input.featured,
					coverUrl: cover.coverUrl,
					coverKey: cover.coverKey,
					copiesTotal: 0,
					copiesAvailable: 0
				});

				const copies = Math.max(0, Math.min(input.copies ?? 1, 40));
				for (let n = 1; n <= copies; n += 1) {
					await tx.insert(holding).values({
						id: `${bookId}-h${String(n).padStart(2, '0')}`,
						bookId,
						inventoryNo: `${cat.code}-${bookId.replace(/^book-/, '').replace(/[^a-z0-9]+/gi, '').slice(0, 10).toUpperCase()}-${String(n).padStart(2, '0')}`,
						status: 'available'
					});
				}
				await syncCopies(tx, bookId);
			}

			if (authors.length) {
				await tx
					.insert(bookAuthor)
					.values(authors.map((authorId, position) => ({ bookId, authorId, position })));
			}
		});
	} catch (cause) {
		const text = cause instanceof Error ? cause.message : '';
		if (text === 'Kniha sa nenašla.') return fail(text);
		return caught(cause, 'ISBN alebo signatúra už vo fonde je.');
	}

	await refreshCatalog({ bookId });
	if (previousKey && previousKey !== cover.coverKey) forgetCover(previousKey);
	return ok();
}

export async function deleteBook(id: string): Promise<DeskResult> {
	const open =
		(
			await db
				.select({ c: count() })
				.from(loan)
				.where(and(eq(loan.bookId, id), isNull(loan.returnedAt)))
				.then((rows) => rows[0])
		)?.c ?? 0;
	if (open > 0) return fail('Kniha má aktívne výpožičky. Najprv ich vráť.');
	const current = await db
		.select({ coverKey: book.coverKey })
		.from(book)
		.where(eq(book.id, id))
		.then((rows) => rows[0]);
	await db.delete(loan).where(eq(loan.bookId, id));
	const gone = await db.delete(book).where(eq(book.id, id)).returning({ id: book.id });
	if (!gone.length) return fail('Kniha sa nenašla.');
	forgetCover(current?.coverKey);
	await refreshCatalog({ deletedBookId: id });
	return ok();
}
