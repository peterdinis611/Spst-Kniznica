import { and, eq, isNull, sql } from 'drizzle-orm';
import { compactIsbn, looksLikeIsbn } from '$lib/isbn';
import { db } from '../db';
import { book, holding, loan, user } from '../db/schema';

export type ScanCopy = {
	id: string;
	inventoryNo: string;
	status: string;
	bookId: string;
	title: string;
	isbn: string;
	callNumber: string;
};

export type ScanLoan = {
	id: string;
	borrowerFirstName: string;
	borrowerLastName: string;
	borrowerClass: string;
	dueAt: Date;
	readerName: string;
	returnOfferedAt: Date | null;
};

export type ScanHit =
	| { kind: 'borrow'; copy: ScanCopy }
	| { kind: 'return'; copy: ScanCopy; loan: ScanLoan }
	| { kind: 'blocked'; copy: ScanCopy; message: string }
	| { kind: 'isbn-out'; copy: ScanCopy; open: number }
	| { kind: 'miss'; code: string };

function asCopy(row: {
	id: string;
	inventoryNo: string;
	status: string;
	bookId: string;
	title: string;
	isbn: string;
	callNumber: string;
}): ScanCopy {
	return row;
}

async function holdingByInventory(code: string) {
	return db
		.select({
			id: holding.id,
			inventoryNo: holding.inventoryNo,
			status: holding.status,
			bookId: holding.bookId,
			title: book.title,
			isbn: book.isbn,
			callNumber: book.callNumber
		})
		.from(holding)
		.innerJoin(book, eq(book.id, holding.bookId))
		.where(sql`lower(${holding.inventoryNo}) = ${code.trim().toLowerCase()}`)
		.then((rows) => rows[0] ?? null);
}

async function bookByIsbn(code: string) {
	const compact = compactIsbn(code);
	if (compact.length < 10) return null;
	return db
		.select({
			id: book.id,
			title: book.title,
			isbn: book.isbn,
			callNumber: book.callNumber
		})
		.from(book)
		.where(sql`isbn_compact = ${compact}`)
		.then((rows) => rows[0] ?? null);
}

async function openLoanForHolding(holdingId: string) {
	return db
		.select({
			id: loan.id,
			borrowerFirstName: loan.borrowerFirstName,
			borrowerLastName: loan.borrowerLastName,
			borrowerClass: loan.borrowerClass,
			dueAt: loan.dueAt,
			readerName: user.name,
			returnOfferedAt: loan.returnOfferedAt
		})
		.from(loan)
		.innerJoin(user, eq(user.id, loan.userId))
		.where(and(eq(loan.holdingId, holdingId), isNull(loan.returnedAt)))
		.then((rows) => rows[0] ?? null);
}

async function copiesOf(bookId: string) {
	return db
		.select({
			id: holding.id,
			inventoryNo: holding.inventoryNo,
			status: holding.status,
			bookId: holding.bookId,
			title: book.title,
			isbn: book.isbn,
			callNumber: book.callNumber
		})
		.from(holding)
		.innerJoin(book, eq(book.id, holding.bookId))
		.where(eq(holding.bookId, bookId));
}

function fromCopy(row: Awaited<ReturnType<typeof copiesOf>>[number], kind: ScanHit['kind'], extra?: Partial<ScanHit>) {
	return { kind, copy: asCopy(row), ...extra } as ScanHit;
}

export async function findScanHit(raw: string): Promise<ScanHit> {
	const code = raw.trim();
	if (code.length < 2) return { kind: 'miss', code };

	const byInventory = await holdingByInventory(code);
	if (byInventory) {
		if (byInventory.status === 'loaned') {
			const open = await openLoanForHolding(byInventory.id);
			if (open) return { kind: 'return', copy: asCopy(byInventory), loan: open };
			return {
				kind: 'blocked',
				copy: asCopy(byInventory),
				message: 'Výtlačok je označený ako vonku, ale lístok sa nenašiel.'
			};
		}
		if (byInventory.status === 'available') {
			return { kind: 'borrow', copy: asCopy(byInventory) };
		}
		return {
			kind: 'blocked',
			copy: asCopy(byInventory),
			message:
				byInventory.status === 'lost'
					? 'Tento výtlačok je stratený.'
					: 'Tento výtlačok je vyradený.'
		};
	}

	if (!looksLikeIsbn(code) && compactIsbn(code).length < 10) {
		return { kind: 'miss', code };
	}

	const held = await bookByIsbn(code);
	if (!held) return { kind: 'miss', code };

	const copies = await copiesOf(held.id);
	const free = copies.find((row) => row.status === 'available');
	if (free) return { kind: 'borrow', copy: asCopy(free) };

	const out = copies.filter((row) => row.status === 'loaned');
	if (out[0]) {
		return fromCopy(out[0], 'isbn-out', { open: out.length });
	}

	const stuck = copies[0];
	if (stuck) {
		return {
			kind: 'blocked',
			copy: asCopy(stuck),
			message: 'Vo fonde nie je voľný výtlačok tohto ISBN.'
		};
	}

	return { kind: 'miss', code };
}
