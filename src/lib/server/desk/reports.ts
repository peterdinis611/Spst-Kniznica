import { and, asc, eq, isNull, lte } from 'drizzle-orm';
import { holdingLabel } from '$lib/admin';
import { toCsv } from '$lib/csv';
import { daysUntil, stampDate } from '$lib/format';
import { db } from '../db';
import { book, category, holding, loan, user } from '../db/schema';

export type InventoryRow = {
	inventoryNo: string;
	status: string;
	title: string;
	callNumber: string;
	isbn: string;
	year: number;
	categoryName: string;
	categoryCode: string;
};

export type OverdueRow = {
	id: string;
	klass: string;
	firstName: string;
	lastName: string;
	title: string;
	callNumber: string;
	dueAt: Date;
	lateDays: number;
};

function startOfToday(now = new Date()) {
	const day = new Date(now);
	day.setHours(0, 0, 0, 0);
	return day;
}

export async function listInventoryRows(): Promise<InventoryRow[]> {
	return db
		.select({
			inventoryNo: holding.inventoryNo,
			status: holding.status,
			title: book.title,
			callNumber: book.callNumber,
			isbn: book.isbn,
			year: book.year,
			categoryName: category.name,
			categoryCode: category.code
		})
		.from(holding)
		.innerJoin(book, eq(book.id, holding.bookId))
		.innerJoin(category, eq(category.id, book.categoryId))
		.orderBy(asc(category.code), asc(book.callNumber), asc(holding.inventoryNo));
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

export function inventoryCsv(rows: InventoryRow[]) {
	return toCsv(
		['inventár', 'stav', 'signatúra', 'názov', 'odbor', 'kód', 'isbn', 'rok'],
		rows.map((row) => [
			row.inventoryNo,
			holdingLabel(row.status),
			row.callNumber,
			row.title,
			row.categoryName,
			row.categoryCode,
			row.isbn,
			row.year
		])
	);
}

export function overdueCsv(rows: OverdueRow[]) {
	return toCsv(
		['trieda', 'meno', 'priezvisko', 'zväzok', 'signatúra', 'termín', 'dni po lehote'],
		rows.map((row) => [
			row.klass,
			row.firstName,
			row.lastName,
			row.title,
			row.callNumber,
			stampDate(row.dueAt),
			row.lateDays
		])
	);
}
