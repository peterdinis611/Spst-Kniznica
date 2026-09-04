import { and, asc, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { LIST_LIMIT } from '@/desk/admin';
import { deskIssue, holdingSchema } from '@/desk/desk-fields';
import { refreshCatalog } from '../admin';
import { db } from '../db';
import { book, category, holding, holdingStatus, loan } from '../db/schema';
import { nextInventory, syncCopies } from './copies';
import { caught, fail, needle, ok, type DeskResult } from './shared';

export async function listDeskHoldings(query = '') {
	const q = query.trim();
	return await db
		.select({
			id: holding.id,
			bookId: holding.bookId,
			inventoryNo: holding.inventoryNo,
			status: holding.status,
			acquiredAt: holding.acquiredAt,
			bookTitle: book.title
		})
		.from(holding)
		.innerJoin(book, eq(book.id, holding.bookId))
		.where(
			q
				? or(
						ilike(holding.inventoryNo, needle(q)),
						ilike(book.title, needle(q)),
						ilike(holding.status, needle(q))
					)
				: undefined
		)
		.orderBy(desc(holding.acquiredAt))
		.limit(LIST_LIMIT);
}

export async function listSpineLabels(query = '') {
	const q = query.trim();
	return await db
		.select({
			id: holding.id,
			inventoryNo: holding.inventoryNo,
			callNumber: book.callNumber,
			title: book.title,
			isbn: book.isbn,
			categoryCode: category.code
		})
		.from(holding)
		.innerJoin(book, eq(book.id, holding.bookId))
		.innerJoin(category, eq(category.id, book.categoryId))
		.where(
			q
				? or(
						ilike(holding.inventoryNo, needle(q)),
						ilike(book.title, needle(q)),
						ilike(book.callNumber, needle(q)),
						ilike(holding.status, needle(q))
					)
				: undefined
		)
		.orderBy(asc(category.code), asc(book.callNumber), asc(holding.inventoryNo))
		.limit(LIST_LIMIT);
}

export async function getDeskHolding(id: string) {
	if (!id) return null;
	return db
		.select({
			id: holding.id,
			bookId: holding.bookId,
			inventoryNo: holding.inventoryNo,
			status: holding.status,
			acquiredAt: holding.acquiredAt,
			bookTitle: book.title
		})
		.from(holding)
		.innerJoin(book, eq(book.id, holding.bookId))
		.where(eq(holding.id, id))
		.then((rows) => rows[0] ?? null);
}

export async function saveHolding(input: {
	id?: string;
	bookId: string;
	inventoryNo: string;
	status: string;
	acquiredAt?: Date | null;
}): Promise<DeskResult> {
	const inventoryNo = input.inventoryNo.trim();
	const issue = deskIssue(holdingSchema, {
		bookId: input.bookId,
		inventoryNo,
		status: input.status
	});
	if (issue) return fail(issue);
	const status = input.status as (typeof holdingStatus)[number];
	const held = await db
		.select()
		.from(book)
		.where(eq(book.id, input.bookId))
		.then((rows) => rows[0]);
	if (!held) return fail('Vyber knihu.');

	try {
		await db.transaction(async (tx) => {
			if (input.id) {
				const current = await tx
					.select()
					.from(holding)
					.where(eq(holding.id, input.id))
					.then((rows) => rows[0]);
				if (!current) throw new Error('Výtlačok sa nenašiel.');
				if (status === 'available' && current.status === 'loaned') {
					const open = await tx
						.select({ c: count() })
						.from(loan)
						.where(and(eq(loan.holdingId, current.id), isNull(loan.returnedAt)))
						.then((rows) => rows[0]?.c ?? 0);
					if (open > 0) throw new Error('Výtlačok je na výpožičke. Najprv ho vráť.');
				}
				await tx
					.update(holding)
					.set({
						bookId: input.bookId,
						inventoryNo: inventoryNo || current.inventoryNo,
						status,
						acquiredAt: input.acquiredAt ?? current.acquiredAt
					})
					.where(eq(holding.id, input.id));
				if (current.bookId !== input.bookId) await syncCopies(tx, current.bookId);
				await syncCopies(tx, input.bookId);
			} else {
				const cat = await tx
					.select({ code: category.code })
					.from(category)
					.where(eq(category.id, held.categoryId))
					.then((rows) => rows[0]);
				await tx.insert(holding).values({
					id: crypto.randomUUID(),
					bookId: input.bookId,
					inventoryNo: inventoryNo || (await nextInventory(input.bookId, cat?.code ?? 'FON')),
					status,
					acquiredAt: input.acquiredAt ?? new Date()
				});
				await syncCopies(tx, input.bookId);
			}
		});
	} catch (cause) {
		const text = cause instanceof Error ? cause.message : '';
		if (text === 'Výtlačok sa nenašiel.' || text.startsWith('Výtlačok je na výpožičke'))
			return fail(text);
		return caught(cause, 'Toto inventárne číslo už vo fonde je.');
	}

	await refreshCatalog({ bookId: input.bookId });
	return ok();
}

export async function deleteHolding(id: string): Promise<DeskResult> {
	const current = await db
		.select()
		.from(holding)
		.where(eq(holding.id, id))
		.then((rows) => rows[0]);
	if (!current) return fail('Výtlačok sa nenašiel.');
	const open =
		(
			await db
				.select({ c: count() })
				.from(loan)
				.where(and(eq(loan.holdingId, id), isNull(loan.returnedAt)))
				.then((rows) => rows[0])
		)?.c ?? 0;
	if (open > 0) return fail('Výtlačok je na výpožičke. Najprv ho vráť.');

	await db.transaction(async (tx) => {
		await tx.delete(holding).where(eq(holding.id, id));
		await syncCopies(tx, current.bookId);
	});
	await refreshCatalog({ bookId: current.bookId });
	return ok();
}
