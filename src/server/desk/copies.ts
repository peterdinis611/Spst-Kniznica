import { and, count, eq } from 'drizzle-orm';
import { db } from '../db';
import { book, holding } from '../db/schema';
import type { DeskTx } from './shared';

export async function syncCopies(tx: DeskTx, bookId: string) {
	const total = await tx
		.select({ c: count() })
		.from(holding)
		.where(eq(holding.bookId, bookId))
		.then((rows) => rows[0]?.c ?? 0);
	const available = await tx
		.select({ c: count() })
		.from(holding)
		.where(and(eq(holding.bookId, bookId), eq(holding.status, 'available')))
		.then((rows) => rows[0]?.c ?? 0);

	await tx
		.update(book)
		.set({ copiesTotal: total, copiesAvailable: available })
		.where(eq(book.id, bookId));
}

export async function nextInventory(bookId: string, code: string) {
	const token = bookId
		.replace(/^book-/, '')
		.replace(/[^a-z0-9]+/gi, '')
		.slice(0, 10)
		.toUpperCase();
	const existing = await db
		.select({ c: count() })
		.from(holding)
		.where(eq(holding.bookId, bookId))
		.then((rows) => rows[0]?.c ?? 0);
	return `${code}-${token}-${String(existing + 1).padStart(2, '0')}`;
}
