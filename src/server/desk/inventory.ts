import { and, count, desc, eq, isNull, ne, or } from 'drizzle-orm';
import { invalidateCatalogCache } from '../catalog-cache';
import { db } from '../db';
import { book, holding, inventoryRun } from '../db/schema';

export type InventoryWalk = {
	id: string;
	startedAt: Date;
	closedAt: Date | null;
	found: number;
};

export async function getLatestInventoryRun(): Promise<InventoryWalk | null> {
	const open = await getOpenInventoryRun();
	if (open) return open;
	const row = await db
		.select()
		.from(inventoryRun)
		.orderBy(desc(inventoryRun.startedAt))
		.then((rows) => rows[0] ?? null);
	if (!row) return null;
	const found =
		(await db
			.select({ c: count() })
			.from(holding)
			.where(eq(holding.inventoryRunId, row.id))
			.then((rows) => rows[0]?.c ?? 0)) ?? 0;
	return { id: row.id, startedAt: row.startedAt, closedAt: row.closedAt, found };
}

export async function getOpenInventoryRun(): Promise<InventoryWalk | null> {
	const row = await db
		.select()
		.from(inventoryRun)
		.where(isNull(inventoryRun.closedAt))
		.orderBy(inventoryRun.startedAt)
		.then((rows) => rows[0] ?? null);
	if (!row) return null;
	const found =
		(await db
			.select({ c: count() })
			.from(holding)
			.where(eq(holding.inventoryRunId, row.id))
			.then((rows) => rows[0]?.c ?? 0)) ?? 0;
	return { id: row.id, startedAt: row.startedAt, closedAt: row.closedAt, found };
}

export async function openInventoryRun(): Promise<InventoryWalk> {
	const open = await getOpenInventoryRun();
	if (open) return open;
	const [row] = await db
		.insert(inventoryRun)
		.values({ note: 'chôdza pultu' })
		.returning();
	if (!row) throw new Error('Inventúra sa neotvorila.');
	return { id: row.id, startedAt: row.startedAt, closedAt: row.closedAt, found: 0 };
}

export async function closeInventoryRun(): Promise<{ ok: true; missing: number } | { ok: false; message: string }> {
	const open = await getOpenInventoryRun();
	if (!open) return { ok: false, message: 'Žiadna otvorená inventúra.' };

	const missing =
		(await db
			.select({ c: count() })
			.from(holding)
			.where(
				and(
					eq(holding.status, 'available'),
					or(isNull(holding.inventoryRunId), ne(holding.inventoryRunId, open.id))
				)
			)
			.then((rows) => rows[0]?.c ?? 0)) ?? 0;

	await db
		.update(inventoryRun)
		.set({ closedAt: new Date() })
		.where(eq(inventoryRun.id, open.id));

	return { ok: true, missing };
}

export async function markHoldingFound(holdingId: string) {
	const open = await openInventoryRun();
	const copy = await db
		.select()
		.from(holding)
		.where(eq(holding.id, holdingId))
		.then((rows) => rows[0] ?? null);
	if (!copy) return { ok: false as const, message: 'Výtlačok vo fonde nie je.' };

	await db
		.update(holding)
		.set({ lastSeenAt: new Date(), inventoryRunId: open.id })
		.where(eq(holding.id, holdingId));

	return { ok: true as const, runId: open.id };
}

export async function markHoldingLost(holdingId: string) {
	const copy = await db
		.select()
		.from(holding)
		.where(eq(holding.id, holdingId))
		.then((rows) => rows[0] ?? null);
	if (!copy) return { ok: false as const, message: 'Výtlačok vo fonde nie je.' };
	if (copy.status === 'loaned') {
		return { ok: false as const, message: 'Výtlačok je na lístku. Najprv ho vráť, potom stratu.' };
	}
	if (copy.status === 'lost') return { ok: true as const };

	const held = await db.select().from(book).where(eq(book.id, copy.bookId)).then((rows) => rows[0]);
	await db.transaction(async (tx) => {
		await tx.update(holding).set({ status: 'lost' }).where(eq(holding.id, holdingId));
		if (copy.status === 'available' && held) {
			await tx
				.update(book)
				.set({ copiesAvailable: Math.max(0, held.copiesAvailable - 1) })
				.where(eq(book.id, copy.bookId));
		}
	});
	invalidateCatalogCache();
	return { ok: true as const };
}
