import { count, isNull } from 'drizzle-orm';
import { db } from '../db';
import { author, book, bookAuthor, category, holding, loan, reservation, user } from '../db/schema';

export async function deskCounts() {
	const [categories, authors, books, links, holdings, loans, openLoans, reservations, readers] =
		await Promise.all([
			db.select({ c: count() }).from(category).then((rows) => rows[0]?.c ?? 0),
			db.select({ c: count() }).from(author).then((rows) => rows[0]?.c ?? 0),
			db.select({ c: count() }).from(book).then((rows) => rows[0]?.c ?? 0),
			db.select({ c: count() }).from(bookAuthor).then((rows) => rows[0]?.c ?? 0),
			db.select({ c: count() }).from(holding).then((rows) => rows[0]?.c ?? 0),
			db.select({ c: count() }).from(loan).then((rows) => rows[0]?.c ?? 0),
			db.select({ c: count() }).from(loan).where(isNull(loan.returnedAt)).then((rows) => rows[0]?.c ?? 0),
			db.select({ c: count() }).from(reservation).then((rows) => rows[0]?.c ?? 0),
			db.select({ c: count() }).from(user).then((rows) => rows[0]?.c ?? 0)
		]);
	return { categories, authors, books, links, holdings, loans, openLoans, reservations, readers };
}
