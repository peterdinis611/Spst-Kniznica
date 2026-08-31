import { and, asc, desc, eq, gt, ilike, isNull, lte } from 'drizzle-orm';
import { db } from '../db';
import { book, loan, reservation, user } from '../db/schema';

export type DeskQueueRow = {
	id: string;
	href: string;
	title: string;
	detail: string;
	stamp: string;
};

export type DeskQueue = {
	overdue: DeskQueueRow[];
	pickup: DeskQueueRow[];
	waiting: DeskQueueRow[];
	passes: DeskQueueRow[];
};

function startOfToday(now = new Date()) {
	const day = new Date(now);
	day.setHours(0, 0, 0, 0);
	return day;
}

function weekAgo(now = new Date()) {
	return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
}

export const emptyDeskQueue = (): DeskQueue => ({
	overdue: [],
	pickup: [],
	waiting: [],
	passes: []
});

export async function deskQueue(now = new Date(), klass = ''): Promise<DeskQueue> {
	const today = startOfToday(now);
	const since = weekAgo(now);
	const classClause = klass ? ilike(loan.borrowerClass, klass) : undefined;
	const overdueWhere = classClause
		? and(isNull(loan.returnedAt), lte(loan.dueAt, today), classClause)
		: and(isNull(loan.returnedAt), lte(loan.dueAt, today));

	if (klass) {
		const overdueRows = await db
			.select({
				id: loan.id,
				title: book.title,
				name: user.name,
				klass: loan.borrowerClass,
				dueAt: loan.dueAt
			})
			.from(loan)
			.innerJoin(book, eq(book.id, loan.bookId))
			.innerJoin(user, eq(user.id, loan.userId))
			.where(overdueWhere)
			.orderBy(asc(loan.dueAt))
			.limit(24);

		return {
			overdue: overdueRows.map((row) => ({
				id: row.id,
				href: `/admin/loans?class=${encodeURIComponent(klass)}&open=1`,
				title: row.title,
				detail: [row.name, row.klass].filter(Boolean).join(' · '),
				stamp: 'po lehote'
			})),
			pickup: [],
			waiting: [],
			passes: []
		};
	}

	const [overdueRows, pickupRows, waitingRows, passRows] = await Promise.all([
		db
			.select({
				id: loan.id,
				title: book.title,
				name: user.name,
				klass: loan.borrowerClass,
				dueAt: loan.dueAt
			})
			.from(loan)
			.innerJoin(book, eq(book.id, loan.bookId))
			.innerJoin(user, eq(user.id, loan.userId))
			.where(overdueWhere)
			.orderBy(asc(loan.dueAt))
			.limit(12),
		db
			.select({
				id: reservation.id,
				title: book.title,
				name: user.name,
				expiresAt: reservation.expiresAt
			})
			.from(reservation)
			.innerJoin(book, eq(book.id, reservation.bookId))
			.innerJoin(user, eq(user.id, reservation.userId))
			.where(and(eq(reservation.status, 'fulfilled'), gt(reservation.expiresAt, now)))
			.orderBy(asc(reservation.expiresAt))
			.limit(12),
		db
			.select({
				id: reservation.id,
				title: book.title,
				name: user.name,
				createdAt: reservation.createdAt
			})
			.from(reservation)
			.innerJoin(book, eq(book.id, reservation.bookId))
			.innerJoin(user, eq(user.id, reservation.userId))
			.where(eq(reservation.status, 'pending'))
			.orderBy(asc(reservation.createdAt))
			.limit(8),
		db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				createdAt: user.createdAt
			})
			.from(user)
			.where(gt(user.createdAt, since))
			.orderBy(desc(user.createdAt))
			.limit(8)
	]);

	return {
		overdue: overdueRows.map((row) => ({
			id: row.id,
			href: `/admin/loans?edit=${row.id}`,
			title: row.title,
			detail: [row.name, row.klass].filter(Boolean).join(' · '),
			stamp: 'po lehote'
		})),
		pickup: pickupRows.map((row) => ({
			id: row.id,
			href: `/admin/reservations?edit=${row.id}`,
			title: row.title,
			detail: row.name,
			stamp: 'na pulte'
		})),
		waiting: waitingRows.map((row) => ({
			id: row.id,
			href: `/admin/reservations?edit=${row.id}`,
			title: row.title,
			detail: row.name,
			stamp: 'čaká'
		})),
		passes: passRows.map((row) => ({
			id: row.id,
			href: `/admin/readers?edit=${row.id}`,
			title: row.name,
			detail: row.email,
			stamp: 'nový'
		}))
	};
}
