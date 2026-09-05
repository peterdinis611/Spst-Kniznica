import { and, desc, eq, inArray } from 'drizzle-orm';
import { hasBorrowErrors, validateBorrow } from '@/desk/borrow-fields';
import { uniqueConstraintMessage } from './admin';
import { db } from './db';
import { book, bookOrder, user } from './db/schema';
import { borrowBook, getActiveLoan } from './library';
import { queueLoanNotice } from './loan-mail';
import type { BorrowerDraft } from '@/types';

const ORDER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATALOG_ID = /^[a-z0-9][a-z0-9._-]{0,79}$/i;

const ALREADY_HELD = 'Túto knihu už máte vypožičanú.';

export type PlaceOrderResult =
	| { ok: true; orderId: string; status: 'queued' | 'claimed' | 'rejected'; message?: string }
	| { ok: false; message: string };

export type FillOrderResult =
	| { ok: true; already?: boolean; dueAt?: Date }
	| { ok: false; message: string };

export async function getOpenBookOrder(userId: string, bookId: string) {
	return db
		.select()
		.from(bookOrder)
		.where(
			and(
				eq(bookOrder.userId, userId),
				eq(bookOrder.bookId, bookId),
				inArray(bookOrder.status, ['queued', 'filling'])
			)
		)
		.then((rows) => rows[0] ?? null);
}

export async function listOpenBookOrders(userId: string) {
	return db
		.select({
			id: bookOrder.id,
			status: bookOrder.status,
			createdAt: bookOrder.createdAt,
			bookId: book.id,
			title: book.title,
			callNumber: book.callNumber
		})
		.from(bookOrder)
		.innerJoin(book, eq(book.id, bookOrder.bookId))
		.where(and(eq(bookOrder.userId, userId), inArray(bookOrder.status, ['queued', 'filling'])))
		.orderBy(desc(bookOrder.createdAt));
}

export async function placeBookOrder(
	userId: string,
	bookId: string,
	draft: BorrowerDraft
): Promise<PlaceOrderResult> {
	if (!CATALOG_ID.test(bookId)) return { ok: false, message: 'Kniha v katalógu nie je.' };
	const slip = validateBorrow({
		firstName: draft.firstName,
		lastName: draft.lastName,
		className: draft.className,
		days: draft.days
	});
	if (hasBorrowErrors(slip)) return { ok: false, message: 'Lístok neprešiel.' };

	const held = await db
		.select({ id: book.id, title: book.title, callNumber: book.callNumber })
		.from(book)
		.where(eq(book.id, bookId))
		.then((rows) => rows[0]);
	if (!held) return { ok: false, message: 'Kniha v katalógu nie je.' };

	const reader = await db
		.select({ name: user.name })
		.from(user)
		.where(eq(user.id, userId))
		.then((rows) => rows[0]);
	if (!reader) return { ok: false, message: 'Preukaz sa nenašiel.' };

	let orderId: string;
	try {
		const [row] = await db
			.insert(bookOrder)
			.values({
				bookId,
				userId,
				status: 'queued',
				borrowerFirstName: draft.firstName,
				borrowerLastName: draft.lastName,
				borrowerClass: draft.className,
				loanDays: draft.days
			})
			.returning({ id: bookOrder.id });
		if (!row) return { ok: false, message: 'Objednávka sa nezaradila.' };
		orderId = row.id;
	} catch (cause) {
		if (uniqueConstraintMessage(cause, 'x')) {
			return { ok: false, message: 'Túto objednávku už máš v zásobníku.' };
		}
		throw cause;
	}

	const { enqueueFolioOrder } = await import('@/server/boss');
	await enqueueFolioOrder({
		kind: 'order',
		orderId,
		bookTitle: held.title,
		readerName: `${draft.firstName} ${draft.lastName}`.trim() || reader?.name || '',
		callNumber: held.callNumber
	});

	const current = await db
		.select({ status: bookOrder.status, message: bookOrder.message })
		.from(bookOrder)
		.where(eq(bookOrder.id, orderId))
		.then((rows) => rows[0]);

	if (current?.status === 'claimed') return { ok: true, orderId, status: 'claimed' };
	if (current?.status === 'rejected') {
		return { ok: true, orderId, status: 'rejected', message: current.message };
	}
	return { ok: true, orderId, status: 'queued' };
}

export async function fillBookOrder(orderId: string): Promise<FillOrderResult> {
	if (!ORDER_ID.test(orderId)) return { ok: false, message: 'Objednávka sa nenašla.' };
	const current = await db
		.select()
		.from(bookOrder)
		.where(eq(bookOrder.id, orderId))
		.then((rows) => rows[0]);
	if (!current) return { ok: false, message: 'Objednávka sa nenašla.' };
	if (
		current.status === 'claimed' ||
		current.status === 'rejected' ||
		current.status === 'cancelled'
	) {
		return { ok: true, already: true };
	}

	if (current.status === 'queued') {
		const [grabbed] = await db
			.update(bookOrder)
			.set({ status: 'filling' })
			.where(and(eq(bookOrder.id, orderId), eq(bookOrder.status, 'queued')))
			.returning({ id: bookOrder.id });
		if (!grabbed) return { ok: true, already: true };
	}

	const open = await getActiveLoan(current.userId, current.bookId);
	if (open) {
		await markClaimed(orderId, open.id);
		return { ok: true, already: true, dueAt: open.dueAt };
	}

	const result = await borrowBook(current.userId, current.bookId, {
		firstName: current.borrowerFirstName,
		lastName: current.borrowerLastName,
		className: current.borrowerClass,
		days: current.loanDays
	});

	if (!result.ok) {
		if (result.message === ALREADY_HELD) {
			const held = await getActiveLoan(current.userId, current.bookId);
			if (held) {
				await markClaimed(orderId, held.id);
				return { ok: true, already: true, dueAt: held.dueAt };
			}
		}
		await db
			.update(bookOrder)
			.set({
				status: 'rejected',
				message: result.message,
				filledAt: new Date()
			})
			.where(eq(bookOrder.id, orderId));
		return { ok: false, message: result.message };
	}

	const loaned = await getActiveLoan(current.userId, current.bookId);
	await markClaimed(orderId, loaned?.id ?? null);
	await stampBorrowMail(current, result.dueAt);
	return { ok: true, dueAt: result.dueAt };
}

async function markClaimed(orderId: string, loanId: string | null) {
	await db
		.update(bookOrder)
		.set({
			status: 'claimed',
			loanId,
			message: '',
			filledAt: new Date()
		})
		.where(eq(bookOrder.id, orderId));
}

async function stampBorrowMail(order: typeof bookOrder.$inferSelect, dueAt: Date) {
	const reader = await db
		.select({ email: user.email, name: user.name })
		.from(user)
		.where(eq(user.id, order.userId))
		.then((rows) => rows[0]);
	const held = await db
		.select({ title: book.title, callNumber: book.callNumber })
		.from(book)
		.where(eq(book.id, order.bookId))
		.then((rows) => rows[0]);
	if (!reader || !held) return;

	await queueLoanNotice({
		kind: 'borrow',
		to: reader.email,
		readerName: `${order.borrowerFirstName} ${order.borrowerLastName}`.trim() || reader.name,
		bookTitle: held.title,
		callNumber: held.callNumber,
		dueAt,
		className: order.borrowerClass,
		days: order.loanDays
	});
}
