import { eq, isNull } from 'drizzle-orm';
import { daysUntil } from '$lib/format';
import { db } from './db';
import { book, loan, user } from './db/schema';
import { notifyHoldReady } from './hold-mail';
import { queueLoanNotice } from './loan-mail';
import { expireHolds } from './waitlist';

export type DeskTickReport = {
	dueSoon: number;
	overdue: number;
	holds: number;
};

export async function runDeskTick(now = new Date()): Promise<DeskTickReport> {
	const offers = await expireHolds(now);
	for (const offer of offers) {
		await notifyHoldReady(offer);
	}

	const open = await db
		.select({
			id: loan.id,
			dueAt: loan.dueAt,
			dueSoonMailedAt: loan.dueSoonMailedAt,
			overdueMailedAt: loan.overdueMailedAt,
			title: book.title,
			callNumber: book.callNumber,
			email: user.email,
			name: user.name
		})
		.from(loan)
		.innerJoin(book, eq(book.id, loan.bookId))
		.innerJoin(user, eq(user.id, loan.userId))
		.where(isNull(loan.returnedAt));

	let dueSoon = 0;
	let overdue = 0;

	for (const row of open) {
		const days = daysUntil(row.dueAt, now);
		if (days === 1 && !row.dueSoonMailedAt) {
			await queueLoanNotice({
				kind: 'dueSoon',
				to: row.email,
				readerName: row.name,
				bookTitle: row.title,
				callNumber: row.callNumber,
				dueAt: row.dueAt
			});
			await db.update(loan).set({ dueSoonMailedAt: now }).where(eq(loan.id, row.id));
			dueSoon += 1;
		}
		if (days < 0 && !row.overdueMailedAt) {
			await queueLoanNotice({
				kind: 'overdue',
				to: row.email,
				readerName: row.name,
				bookTitle: row.title,
				callNumber: row.callNumber,
				dueAt: row.dueAt
			});
			await db.update(loan).set({ overdueMailedAt: now }).where(eq(loan.id, row.id));
			overdue += 1;
		}
	}

	return { dueSoon, overdue, holds: offers.length };
}
