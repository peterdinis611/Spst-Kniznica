import { and, asc, eq, ilike, or } from 'drizzle-orm';
import { LIST_LIMIT } from '@/desk/admin';
import { deskIssue, linkSchema } from '@/desk/desk-fields';
import { refreshCatalog } from '../admin';
import { db } from '../db';
import { author, book, bookAuthor } from '../db/schema';
import { caught, fail, needle, ok, type DeskResult } from './shared';

export async function listDeskLinks(query = '') {
	const q = query.trim();
	return await db
		.select({
			bookId: bookAuthor.bookId,
			authorId: bookAuthor.authorId,
			position: bookAuthor.position,
			bookTitle: book.title,
			authorName: author.name
		})
		.from(bookAuthor)
		.innerJoin(book, eq(book.id, bookAuthor.bookId))
		.innerJoin(author, eq(author.id, bookAuthor.authorId))
		.where(q ? or(ilike(book.title, needle(q)), ilike(author.name, needle(q))) : undefined)
		.orderBy(asc(book.title), asc(bookAuthor.position))
		.limit(LIST_LIMIT);
}

export async function saveLink(input: {
	bookId: string;
	authorId: string;
	position: number;
}): Promise<DeskResult> {
	const issue = deskIssue(linkSchema, {
		bookId: input.bookId,
		authorId: input.authorId,
		position: input.position
	});
	if (issue) return fail(issue);
	const held = await db
		.select({ id: book.id })
		.from(book)
		.where(eq(book.id, input.bookId))
		.then((rows) => rows[0]);
	const person = await db
		.select({ id: author.id })
		.from(author)
		.where(eq(author.id, input.authorId))
		.then((rows) => rows[0]);
	if (!held) return fail('Kniha sa nenašla.');
	if (!person) return fail('Autor sa nenašiel.');

	try {
		await db
			.insert(bookAuthor)
			.values({
				bookId: input.bookId,
				authorId: input.authorId,
				position: Math.max(0, input.position)
			})
			.onConflictDoUpdate({
				target: [bookAuthor.bookId, bookAuthor.authorId],
				set: { position: Math.max(0, input.position) }
			});
	} catch (cause) {
		return caught(cause, 'Táto väzba už vo fonde je.');
	}

	await refreshCatalog({ bookId: input.bookId });
	return ok();
}

export async function deleteLink(bookId: string, authorId: string): Promise<DeskResult> {
	const gone = await db
		.delete(bookAuthor)
		.where(and(eq(bookAuthor.bookId, bookId), eq(bookAuthor.authorId, authorId)))
		.returning({ bookId: bookAuthor.bookId });
	if (!gone.length) return fail('Väzba sa nenašla.');
	await refreshCatalog({ bookId });
	return ok();
}
