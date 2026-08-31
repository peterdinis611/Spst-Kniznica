import { and, eq, gt, isNull } from 'drizzle-orm';
import { daysUntil } from '$lib/format';
import { db } from './db';
import { book, loan, reservation, user } from './db/schema';
import { listDeskLoans } from './desk/loans';
import { notifyHoldExpired, notifyHoldReady, queueHoldNotice } from './hold-mail';
import { queueLoanNotice } from './loan-mail';
import { queueClassDigest, shouldMailClassDigest } from './teacher-mail';
import { expireHolds } from './waitlist';

export type DeskTickReport = {
	dueSoon: number;
	overdue: number;
	holds: number;
	expireSoon: number;
	expired: number;
	classDigests: number;
};

export async function runDeskTick(now = new Date()): Promise<DeskTickReport> {
	const { offers, lapsed } = await expireHolds(now);
	for (const lapse of lapsed) {
		await notifyHoldExpired(lapse);
	}
	for (const offer of offers) {
		await notifyHoldReady(offer);
	}

	const ready = await db
		.select({
			id: reservation.id,
			expiresAt: reservation.expiresAt,
			expireSoonMailedAt: reservation.expireSoonMailedAt,
			title: book.title,
			callNumber: book.callNumber,
			email: user.email,
			name: user.name
		})
		.from(reservation)
		.innerJoin(book, eq(book.id, reservation.bookId))
		.innerJoin(user, eq(user.id, reservation.userId))
		.where(and(eq(reservation.status, 'fulfilled'), gt(reservation.expiresAt, now)));

	let expireSoon = 0;
	for (const row of ready) {
		if (daysUntil(row.expiresAt, now) !== 1 || row.expireSoonMailedAt) continue;
		await queueHoldNotice({
			kind: 'expireSoon',
			to: row.email,
			readerName: row.name,
			bookTitle: row.title,
			callNumber: row.callNumber,
			expiresAt: row.expiresAt
		});
		await db.update(reservation).set({ expireSoonMailedAt: now }).where(eq(reservation.id, row.id));
		expireSoon += 1;
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

	const classDigests = await mailClassDigests(now);

	return {
		dueSoon,
		overdue,
		holds: offers.length,
		expireSoon,
		expired: lapsed.length,
		classDigests
	};
}

async function mailClassDigests(now: Date) {
	const teachers = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			className: user.className,
			classDigestMailedAt: user.classDigestMailedAt,
			classDigestOverdue: user.classDigestOverdue
		})
		.from(user)
		.where(eq(user.role, 'teacher'));

	let sent = 0;
	for (const teacher of teachers) {
		const klass = teacher.className.trim();
		if (!klass) continue;

		const rows = await listDeskLoans({ q: '', klass, open: true });
		const overdue = rows.filter((row) => daysUntil(row.dueAt, now) < 0).length;
		if (rows.length === 0) {
			if (teacher.classDigestOverdue !== 0) {
				await db.update(user).set({ classDigestOverdue: 0 }).where(eq(user.id, teacher.id));
			}
			continue;
		}

		if (
			!shouldMailClassDigest({
				open: rows.length,
				overdue,
				lastOverdue: teacher.classDigestOverdue,
				mailedAt: teacher.classDigestMailedAt,
				now
			})
		) {
			continue;
		}

		await queueClassDigest({
			to: teacher.email,
			teacherName: teacher.name,
			className: klass,
			open: rows.length,
			overdue,
			rows: rows.map((row) => ({
				title: row.bookTitle,
				reader: `${row.borrowerFirstName} ${row.borrowerLastName}`.trim() || row.readerName,
				dueAt: row.dueAt,
				late: daysUntil(row.dueAt, now) < 0
			}))
		});
		await db
			.update(user)
			.set({ classDigestMailedAt: now, classDigestOverdue: overdue })
			.where(eq(user.id, teacher.id));
		sent += 1;
	}

	return sent;
}
