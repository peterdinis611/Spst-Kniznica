import { and, count, eq, sql } from 'drizzle-orm';
import { uniqueConstraintMessage } from '../admin';
import { db } from '../db';
import { book, holding } from '../db/schema';
import type { DeskTx } from './shared';

export function borrowConflictMessage(cause: unknown) {
	const text = cause instanceof Error ? cause.message : String(cause);
	if (/loan_one_active_uidx/.test(text)) return 'Túto knihu už máte vypožičanú.';
	if (/loan_one_holding_open_uidx/.test(text)) return 'Žiadny voľný výtlačok. Skúste neskôr.';
	return uniqueConstraintMessage(cause, 'Žiadny voľný výtlačok. Skúste neskôr.');
}

export async function lockBook(tx: DeskTx, bookId: string) {
	await tx.execute(sql`select 1 from book where id = ${bookId} for update`);
}

export async function claimAvailableCopy(tx: DeskTx, bookId: string, holdingId?: string | null) {
	const filter = holdingId
		? and(eq(holding.id, holdingId), eq(holding.bookId, bookId), eq(holding.status, 'available'))
		: and(
				eq(holding.bookId, bookId),
				eq(holding.status, 'available'),
				sql`${holding.id} = (
					select id from holding
					where book_id = ${bookId}
						and status = 'available'
					order by inventory_no
					limit 1
					for update skip locked
				)`
			);

	const [copy] = await tx.update(holding).set({ status: 'loaned' }).where(filter).returning();
	return copy ?? null;
}

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
