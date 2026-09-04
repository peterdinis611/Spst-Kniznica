import { and, asc, eq, isNull, lte } from 'drizzle-orm';
import type { InventoryRow, OverdueRow } from '@/desk/desk-export';
import { inventorySight } from '@/catalog/inventory-sight';
import { daysUntil } from '@/utils/format';
import { db } from '../db';
import { book, category, holding, loan, user } from '../db/schema';
import { getLatestInventoryRun } from './inventory';

export type { InventoryRow, OverdueRow };
export { inventoryCsv, inventoryXml, overdueCsv, overdueXml } from '@/desk/desk-export';

function startOfToday(now = new Date()) {
	const day = new Date(now);
	day.setHours(0, 0, 0, 0);
	return day;
}

export async function listInventoryRows(): Promise<InventoryRow[]> {
	const walk = await getLatestInventoryRun();
	const rows = await db
		.select({
			inventoryNo: holding.inventoryNo,
			status: holding.status,
			title: book.title,
			callNumber: book.callNumber,
			isbn: book.isbn,
			year: book.year,
			categoryName: category.name,
			categoryCode: category.code,
			lastSeenAt: holding.lastSeenAt,
			inventoryRunId: holding.inventoryRunId
		})
		.from(holding)
		.innerJoin(book, eq(book.id, holding.bookId))
		.innerJoin(category, eq(category.id, book.categoryId))
		.orderBy(asc(category.code), asc(book.callNumber), asc(holding.inventoryNo));

	return rows.map((row) => ({
		inventoryNo: row.inventoryNo,
		status: row.status,
		title: row.title,
		callNumber: row.callNumber,
		isbn: row.isbn,
		year: row.year,
		categoryName: row.categoryName,
		categoryCode: row.categoryCode,
		lastSeenAt: row.lastSeenAt,
		sight: inventorySight({
			status: row.status,
			runId: walk?.id ?? null,
			markedRunId: row.inventoryRunId
		})
	}));
}

export async function listOverdueRows(now = new Date()): Promise<OverdueRow[]> {
	const today = startOfToday(now);
	const rows = await db
		.select({
			id: loan.id,
			klass: loan.borrowerClass,
			firstName: loan.borrowerFirstName,
			lastName: loan.borrowerLastName,
			title: book.title,
			callNumber: book.callNumber,
			dueAt: loan.dueAt
		})
		.from(loan)
		.innerJoin(book, eq(book.id, loan.bookId))
		.innerJoin(user, eq(user.id, loan.userId))
		.where(and(isNull(loan.returnedAt), lte(loan.dueAt, today)))
		.orderBy(asc(loan.borrowerClass), asc(loan.borrowerLastName), asc(loan.dueAt));

	return rows.map((row) => {
		const days = daysUntil(row.dueAt, now);
		return {
			...row,
			lateDays: days < 0 ? Math.abs(days) : 1
		};
	});
}
