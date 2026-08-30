import { and, asc, count, eq, gt, inArray, isNull, lt, or } from 'drizzle-orm';
import { HOLD_DAYS } from '$lib/hold';
import type { WaitSlip } from '$lib/types';
import { db } from './db';
import { book, category, loan, reservation, user } from './db/schema';
import type { DeskTx } from './desk/shared';

export type HoldOffer = {
	reservationId: string;
	userId: string;
	email: string;
	name: string;
	bookTitle: string;
	callNumber: string;
	expiresAt: Date;
};

export type ReserveResult = { ok: true; expiresAt: Date; place: number } | { ok: false; message: string };
export type CancelHoldResult = { ok: true; offer: HoldOffer | null } | { ok: false; message: string };

function daysFromNow(days: number, now = new Date()) {
	return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

function toWaitBook(
	held: typeof book.$inferSelect,
	cat: typeof category.$inferSelect
): WaitSlip['book'] {
	return {
		id: held.id,
		title: held.title,
		callNumber: held.callNumber,
		copiesTotal: held.copiesTotal,
		copiesAvailable: held.copiesAvailable,
		coverUrl: held.coverUrl ?? null,
		category: {
			id: cat.id,
			name: cat.name,
			slug: cat.slug,
			code: cat.code,
			accent: cat.accent
		},
		authors: []
	};
}

export async function getOpenHold(userId: string, bookId: string) {
	if (!userId || !bookId) return null;
	return (
		db
			.select()
			.from(reservation)
			.where(
				and(
					eq(reservation.userId, userId),
					eq(reservation.bookId, bookId),
					inArray(reservation.status, ['pending', 'fulfilled'])
				)
			)
			.then((rows) => rows[0] ?? null)
	);
}

export async function bookHoldUserId(bookId: string): Promise<string | null> {
	const now = new Date();
	const hold = await db
		.select({ userId: reservation.userId })
		.from(reservation)
		.where(
			and(
				eq(reservation.bookId, bookId),
				eq(reservation.status, 'fulfilled'),
				gt(reservation.expiresAt, now)
			)
		)
		.orderBy(asc(reservation.createdAt))
		.then((rows) => rows[0] ?? null);
	return hold?.userId ?? null;
}

export async function waitingBookIds(ids: string[]) {
	const held = new Set<string>();
	if (!ids.length) return held;
	const rows = await db
		.select({ bookId: reservation.bookId })
		.from(reservation)
		.where(
			and(inArray(reservation.bookId, ids), inArray(reservation.status, ['pending', 'fulfilled']))
		);
	for (const row of rows) held.add(row.bookId);
	return held;
}

export async function listUserWaits(userId: string): Promise<WaitSlip[]> {
	const rows = await db
		.select({ reservation, book, category })
		.from(reservation)
		.innerJoin(book, eq(book.id, reservation.bookId))
		.innerJoin(category, eq(category.id, book.categoryId))
		.where(
			and(eq(reservation.userId, userId), inArray(reservation.status, ['pending', 'fulfilled']))
		)
		.orderBy(asc(reservation.createdAt));

	const ahead = await Promise.all(
		rows
			.filter((row) => row.reservation.status === 'pending')
			.map(async (row) => {
				const n = await db
					.select({ c: count() })
					.from(reservation)
					.where(
						and(
							eq(reservation.bookId, row.reservation.bookId),
							eq(reservation.status, 'pending'),
							or(
								lt(reservation.createdAt, row.reservation.createdAt),
								and(
									eq(reservation.createdAt, row.reservation.createdAt),
									lt(reservation.id, row.reservation.id)
								)
							)
						)
					)
					.then((items) => items[0]?.c ?? 0);
				return [row.reservation.id, n + 1] as const;
			})
	);
	const placeById = new Map(ahead);

	return rows.map((row) => ({
		id: row.reservation.id,
		bookId: row.reservation.bookId,
		status: row.reservation.status as 'pending' | 'fulfilled',
		createdAt: row.reservation.createdAt,
		expiresAt: row.reservation.expiresAt,
		place: row.reservation.status === 'fulfilled' ? 0 : (placeById.get(row.reservation.id) ?? 1),
		book: toWaitBook(row.book, row.category)
	}));
}

export async function reserveBook(userId: string, bookId: string): Promise<ReserveResult> {
	const result = await db.transaction(async (tx): Promise<ReserveResult> => {
		const held = await tx.select().from(book).where(eq(book.id, bookId)).then((rows) => rows[0]);
		if (!held) return { ok: false, message: 'Kniha v katalógu nie je.' };

		const openLoan = await tx
			.select({ id: loan.id })
			.from(loan)
			.where(and(eq(loan.userId, userId), eq(loan.bookId, bookId), isNull(loan.returnedAt)))
			.then((rows) => rows[0]);
		if (openLoan) return { ok: false, message: 'Túto knihu už máš vypožičanú.' };

		const existing = await tx
			.select()
			.from(reservation)
			.where(
				and(
					eq(reservation.userId, userId),
					eq(reservation.bookId, bookId),
					inArray(reservation.status, ['pending', 'fulfilled'])
				)
			)
			.then((rows) => rows[0]);
		if (existing) {
			return existing.status === 'fulfilled'
				? { ok: false, message: 'Tento zväzok už máš pripravený na pulte.' }
				: { ok: false, message: 'Čakací lístok na tento zväzok už máš.' };
		}

		if (held.copiesAvailable > 0) {
			const hold = await tx
				.select({ userId: reservation.userId })
				.from(reservation)
				.where(
					and(
						eq(reservation.bookId, bookId),
						eq(reservation.status, 'fulfilled'),
						gt(reservation.expiresAt, new Date())
					)
				)
				.then((rows) => rows[0]);
			const firstWait = await tx
				.select({ userId: reservation.userId })
				.from(reservation)
				.where(and(eq(reservation.bookId, bookId), eq(reservation.status, 'pending')))
				.orderBy(asc(reservation.createdAt), asc(reservation.id))
				.then((rows) => rows[0]);
			const blocked =
				(hold && hold.userId !== userId) || (firstWait && firstWait.userId !== userId);
			if (!blocked) return { ok: false, message: 'Výtlačok je voľný. Požičaj ho z karty.' };
		}

		const ahead =
			(await tx
				.select({ c: count() })
				.from(reservation)
				.where(and(eq(reservation.bookId, bookId), eq(reservation.status, 'pending')))
				.then((rows) => rows[0]?.c ?? 0)) + 1;

		const now = new Date();
		const expiresAt = daysFromNow(30, now);
		await tx.insert(reservation).values({
			bookId,
			userId,
			status: 'pending',
			createdAt: now,
			expiresAt
		});

		return { ok: true as const, expiresAt, place: ahead };
	});

	return result;
}

export async function cancelHold(userId: string, reservationId: string): Promise<CancelHoldResult> {
	const current = await db
		.select()
		.from(reservation)
		.where(and(eq(reservation.id, reservationId), eq(reservation.userId, userId)))
		.then((rows) => rows[0]);
	if (!current) return { ok: false, message: 'Čakací lístok sa nenašiel.' };
	if (current.status !== 'pending' && current.status !== 'fulfilled') {
		return { ok: false, message: 'Tento lístok už nie je v rade.' };
	}

	let offer: HoldOffer | null = null;
	await db.transaction(async (tx) => {
		await tx
			.update(reservation)
			.set({ status: 'cancelled' })
			.where(eq(reservation.id, reservationId));
		if (current.status === 'fulfilled') {
			offer = await offerCopyToWaiter(tx, current.bookId);
		}
	});

	return { ok: true, offer };
}

export async function closeHoldOnBorrow(tx: DeskTx, userId: string, bookId: string) {
	await tx
		.update(reservation)
		.set({ status: 'fulfilled', expiresAt: new Date() })
		.where(
			and(
				eq(reservation.userId, userId),
				eq(reservation.bookId, bookId),
				inArray(reservation.status, ['pending', 'fulfilled'])
			)
		);
}

export async function offerCopyToWaiter(tx: DeskTx, bookId: string): Promise<HoldOffer | null> {
	const now = new Date();
	const held = await tx
		.select({
			copiesAvailable: book.copiesAvailable,
			title: book.title,
			callNumber: book.callNumber
		})
		.from(book)
		.where(eq(book.id, bookId))
		.then((rows) => rows[0]);
	if (!held || held.copiesAvailable < 1) return null;

	const claimed =
		(await tx
			.select({ c: count() })
			.from(reservation)
			.where(
				and(
					eq(reservation.bookId, bookId),
					eq(reservation.status, 'fulfilled'),
					gt(reservation.expiresAt, now)
				)
			)
			.then((rows) => rows[0]?.c ?? 0)) ?? 0;

	if (held.copiesAvailable - claimed < 1) return null;

	const next = await tx
		.select({
			id: reservation.id,
			userId: reservation.userId,
			email: user.email,
			name: user.name
		})
		.from(reservation)
		.innerJoin(user, eq(user.id, reservation.userId))
		.where(and(eq(reservation.bookId, bookId), eq(reservation.status, 'pending')))
		.orderBy(asc(reservation.createdAt), asc(reservation.id))
		.then((rows) => rows[0]);

	if (!next) return null;

	const expiresAt = daysFromNow(HOLD_DAYS, now);
	await tx
		.update(reservation)
		.set({ status: 'fulfilled', expiresAt })
		.where(eq(reservation.id, next.id));

	return {
		reservationId: next.id,
		userId: next.userId,
		email: next.email,
		name: next.name,
		bookTitle: held.title,
		callNumber: held.callNumber,
		expiresAt
	};
}

export async function expireHolds(now = new Date()) {
	const stale = await db
		.select({
			id: reservation.id,
			bookId: reservation.bookId,
			userId: reservation.userId
		})
		.from(reservation)
		.where(and(eq(reservation.status, 'fulfilled'), lt(reservation.expiresAt, now)));

	const offers: HoldOffer[] = [];
	for (const row of stale) {
		const stillOut = await db
			.select({ id: loan.id })
			.from(loan)
			.where(and(eq(loan.userId, row.userId), eq(loan.bookId, row.bookId), isNull(loan.returnedAt)))
			.then((items) => items[0]);
		if (stillOut) continue;

		const offer = await db.transaction(async (tx) => {
			await tx.update(reservation).set({ status: 'expired' }).where(eq(reservation.id, row.id));
			return offerCopyToWaiter(tx, row.bookId);
		});
		if (offer) offers.push(offer);
	}

	return offers;
}
