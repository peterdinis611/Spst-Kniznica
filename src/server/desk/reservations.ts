import { desc, eq, ilike, or } from 'drizzle-orm';
import { LIST_LIMIT } from '@/desk/admin';
import { deskIssue, reservationSchema } from '@/desk/desk-fields';
import { db } from '../db';
import { book, reservation, reservationStatus, user } from '../db/schema';
import { caught, fail, needle, ok, type DeskResult } from './shared';

export async function listDeskReservations(query = '') {
	const q = query.trim();
	return await db
		.select({
			id: reservation.id,
			bookId: reservation.bookId,
			userId: reservation.userId,
			createdAt: reservation.createdAt,
			expiresAt: reservation.expiresAt,
			status: reservation.status,
			bookTitle: book.title,
			callNumber: book.callNumber,
			readerName: user.name,
			readerEmail: user.email
		})
		.from(reservation)
		.innerJoin(book, eq(book.id, reservation.bookId))
		.innerJoin(user, eq(user.id, reservation.userId))
		.where(
			q
				? or(
						ilike(book.title, needle(q)),
						ilike(user.name, needle(q)),
						ilike(reservation.status, needle(q))
					)
				: undefined
		)
		.orderBy(desc(reservation.createdAt))
		.limit(LIST_LIMIT);
}

export async function getDeskReservation(id: string) {
	if (!id) return null;
	return db
		.select({
			id: reservation.id,
			bookId: reservation.bookId,
			userId: reservation.userId,
			createdAt: reservation.createdAt,
			expiresAt: reservation.expiresAt,
			status: reservation.status,
			bookTitle: book.title,
			callNumber: book.callNumber,
			readerName: user.name,
			readerEmail: user.email
		})
		.from(reservation)
		.innerJoin(book, eq(book.id, reservation.bookId))
		.innerJoin(user, eq(user.id, reservation.userId))
		.where(eq(reservation.id, id))
		.then((rows) => rows[0] ?? null);
}

export async function saveReservation(input: {
	id?: string;
	bookId: string;
	userId: string;
	status: string;
	createdAt?: Date | null;
	expiresAt?: Date | null;
}): Promise<DeskResult & { id?: string }> {
	const issue = deskIssue(reservationSchema, {
		bookId: input.bookId,
		userId: input.userId,
		status: input.status
	});
	if (issue) return fail(issue);
	const status = input.status as (typeof reservationStatus)[number];
	const held = await db
		.select({ id: book.id })
		.from(book)
		.where(eq(book.id, input.bookId))
		.then((rows) => rows[0]);
	const reader = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.id, input.userId))
		.then((rows) => rows[0]);
	if (!held) return fail('Vyber knihu.');
	if (!reader) return fail('Vyber čitateľa.');
	const createdAt = input.createdAt ?? new Date();
	const expiresAt = input.expiresAt ?? new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);

	try {
		if (input.id) {
			const current = await db
				.select()
				.from(reservation)
				.where(eq(reservation.id, input.id))
				.then((rows) => rows[0]);
			if (!current) return fail('Rezervácia sa nenašla.');
			const expireSoonMailedAt =
				status === 'fulfilled' &&
				current.status === 'fulfilled' &&
				current.expiresAt.getTime() === expiresAt.getTime()
					? current.expireSoonMailedAt
					: null;
			await db
				.update(reservation)
				.set({
					bookId: input.bookId,
					userId: input.userId,
					status,
					createdAt,
					expiresAt,
					expireSoonMailedAt
				})
				.where(eq(reservation.id, input.id));
			return { ok: true, id: input.id };
		}
		const inserted = await db
			.insert(reservation)
			.values({
				bookId: input.bookId,
				userId: input.userId,
				status,
				createdAt,
				expiresAt
			})
			.returning({ id: reservation.id });
		return { ok: true, id: inserted[0]?.id };
	} catch (cause) {
		return caught(cause, 'Rezervácia sa neuložila.');
	}
}

export async function deleteReservation(id: string): Promise<DeskResult> {
	const gone = await db
		.delete(reservation)
		.where(eq(reservation.id, id))
		.returning({ id: reservation.id });
	if (!gone.length) return fail('Rezervácia sa nenašla.');
	return ok();
}
