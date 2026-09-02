import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { LIST_LIMIT } from '$lib/admin';
import { normalizeClass, parseLoanDays } from '$lib/borrow-fields';
import { deskIssue, deskLoanSchema } from '$lib/desk-fields';
import { refreshCatalog } from '../admin';
import { db } from '../db';
import { book, holding, loan, user } from '../db/schema';
import { notifyHoldReady } from '../hold-mail';
import { offerCopyToWaiter } from '../waitlist';
import { syncCopies } from './copies';
import { caught, fail, needle, ok, type DeskResult } from './shared';

export type DeskLoanFilter = {
	q: string;
	klass: string;
	open: boolean;
};

export function parseDeskLoanFilter(url: URL): DeskLoanFilter {
	return {
		q: url.searchParams.get('q') ?? '',
		klass: normalizeClass(url.searchParams.get('class') ?? ''),
		open: url.searchParams.get('open') === '1'
	};
}

function asLoanFilter(input: string | DeskLoanFilter = ''): DeskLoanFilter {
	if (typeof input === 'string') return { q: input, klass: '', open: false };
	return input;
}

export async function listDeskLoans(input: string | DeskLoanFilter = '') {
	const filter = asLoanFilter(input);
	const q = filter.q.trim();
	const klass = normalizeClass(filter.klass);
	const clauses = [
		q
			? or(
					ilike(book.title, needle(q)),
					ilike(user.name, needle(q)),
					ilike(user.email, needle(q)),
					ilike(loan.borrowerLastName, needle(q)),
					ilike(loan.borrowerClass, needle(q))
				)
			: undefined,
		klass ? eq(loan.borrowerClass, klass) : undefined,
		filter.open ? isNull(loan.returnedAt) : undefined
	].filter((clause) => clause != null);

	return await db
		.select({
			id: loan.id,
			bookId: loan.bookId,
			holdingId: loan.holdingId,
			userId: loan.userId,
			borrowedAt: loan.borrowedAt,
			dueAt: loan.dueAt,
			returnedAt: loan.returnedAt,
			renewalCount: loan.renewalCount,
			borrowerFirstName: loan.borrowerFirstName,
			borrowerLastName: loan.borrowerLastName,
			borrowerClass: loan.borrowerClass,
			loanDays: loan.loanDays,
			bookTitle: book.title,
			readerName: user.name,
			readerEmail: user.email
		})
		.from(loan)
		.innerJoin(book, eq(book.id, loan.bookId))
		.innerJoin(user, eq(user.id, loan.userId))
		.where(clauses.length > 1 ? and(...clauses) : clauses[0])
		.orderBy(desc(loan.borrowedAt))
		.limit(LIST_LIMIT);
}

export async function listDeskClasses() {
	const rows = await db
		.selectDistinct({ klass: loan.borrowerClass })
		.from(loan)
		.orderBy(loan.borrowerClass);
	const seen = new Set<string>();
	const classes: string[] = [];
	for (const row of rows) {
		const klass = normalizeClass(row.klass);
		if (!klass || seen.has(klass)) continue;
		seen.add(klass);
		classes.push(klass);
	}
	return classes;
}

export async function countOpenClassLoans(klass: string) {
	const token = normalizeClass(klass);
	if (!token) return 0;
	return (
		(
			await db
				.select({ c: count() })
				.from(loan)
				.where(and(isNull(loan.returnedAt), eq(loan.borrowerClass, token)))
				.then((rows) => rows[0])
		)?.c ?? 0
	);
}

export async function getDeskLoan(id: string) {
	if (!id) return null;
	return db
		.select({
			id: loan.id,
			bookId: loan.bookId,
			holdingId: loan.holdingId,
			userId: loan.userId,
			borrowedAt: loan.borrowedAt,
			dueAt: loan.dueAt,
			returnedAt: loan.returnedAt,
			renewalCount: loan.renewalCount,
			borrowerFirstName: loan.borrowerFirstName,
			borrowerLastName: loan.borrowerLastName,
			borrowerClass: loan.borrowerClass,
			loanDays: loan.loanDays,
			bookTitle: book.title,
			callNumber: book.callNumber,
			readerName: user.name,
			readerEmail: user.email
		})
		.from(loan)
		.innerJoin(book, eq(book.id, loan.bookId))
		.innerJoin(user, eq(user.id, loan.userId))
		.where(eq(loan.id, id))
		.then((rows) => rows[0] ?? null);
}

export async function saveLoan(input: {
	id?: string;
	bookId: string;
	holdingId: string;
	userId: string;
	borrowerFirstName: string;
	borrowerLastName: string;
	borrowerClass: string;
	loanDays: number;
	borrowedAt?: Date | null;
	dueAt?: Date | null;
	returnedAt?: Date | null;
	renewalCount?: number;
}): Promise<DeskResult> {
	const first = input.borrowerFirstName.trim();
	const last = input.borrowerLastName.trim();
	const klass = normalizeClass(input.borrowerClass);
	const issue = deskIssue(deskLoanSchema, {
		bookId: input.bookId,
		userId: input.userId,
		borrowerFirstName: first,
		borrowerLastName: last,
		borrowerClass: klass,
		loanDays: input.loanDays
	});
	if (issue) return fail(issue);
	const days = parseLoanDays(String(input.loanDays));
	if (!days) return fail('Doba výpožičky nie je v rozsahu.');
	const held = await db
		.select()
		.from(book)
		.where(eq(book.id, input.bookId))
		.then((rows) => rows[0]);
	const reader = await db
		.select()
		.from(user)
		.where(eq(user.id, input.userId))
		.then((rows) => rows[0]);
	if (!held) return fail('Vyber knihu.');
	if (!reader) return fail('Vyber čitateľa.');

	try {
		await db.transaction(async (tx) => {
			if (input.id) {
				const current = await tx
					.select()
					.from(loan)
					.where(eq(loan.id, input.id))
					.then((rows) => rows[0]);
				if (!current) throw new Error('Výpožička sa nenašla.');
				const borrowedAt = input.borrowedAt ?? current.borrowedAt;
				const dueAt = input.dueAt ?? new Date(borrowedAt.getTime() + days * 24 * 60 * 60 * 1000);
				const dueShifted = Math.abs(dueAt.getTime() - current.dueAt.getTime()) > 60_000;
				await tx
					.update(loan)
					.set({
						borrowerFirstName: first,
						borrowerLastName: last,
						borrowerClass: klass,
						loanDays: days,
						borrowedAt,
						dueAt,
						returnedAt: input.returnedAt ?? current.returnedAt,
						renewalCount: input.renewalCount ?? current.renewalCount,
						dueSoonMailedAt: dueShifted ? null : current.dueSoonMailedAt,
						overdueMailedAt: dueShifted ? null : current.overdueMailedAt
					})
					.where(eq(loan.id, input.id));
			} else {
				const copy = input.holdingId
					? await tx
							.select()
							.from(holding)
							.where(eq(holding.id, input.holdingId))
							.then((rows) => rows[0])
					: await tx
							.select()
							.from(holding)
							.where(and(eq(holding.bookId, input.bookId), eq(holding.status, 'available')))
							.then((rows) => rows[0]);
				if (!copy || copy.status !== 'available') {
					throw new Error('Žiadny voľný výtlačok.');
				}
				const now = input.borrowedAt ?? new Date();
				const dueAt = input.dueAt ?? new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
				await tx.insert(loan).values({
					bookId: input.bookId,
					holdingId: copy.id,
					userId: input.userId,
					borrowedAt: now,
					dueAt,
					borrowerFirstName: first,
					borrowerLastName: last,
					borrowerClass: klass,
					loanDays: days
				});
				await tx.update(holding).set({ status: 'loaned' }).where(eq(holding.id, copy.id));
				await syncCopies(tx, input.bookId);
			}
		});
	} catch (cause) {
		const text = cause instanceof Error ? cause.message : '';
		if (text === 'Výpožička sa nenašla.' || text === 'Žiadny voľný výtlačok.') return fail(text);
		return caught(cause, 'Výpožička sa neuložila.');
	}

	await refreshCatalog({ bookId: input.bookId });
	return ok();
}

export async function returnDeskLoan(id: string): Promise<DeskResult> {
	const current = await db
		.select()
		.from(loan)
		.where(eq(loan.id, id))
		.then((rows) => rows[0]);
	if (!current) return fail('Výpožička sa nenašla.');
	if (current.returnedAt) return fail('Táto kniha je už vrátená.');

	let offer = null as Awaited<ReturnType<typeof offerCopyToWaiter>>;
	await db.transaction(async (tx) => {
		await tx.update(loan).set({ returnedAt: new Date() }).where(eq(loan.id, id));
		if (current.holdingId) {
			await tx.update(holding).set({ status: 'available' }).where(eq(holding.id, current.holdingId));
		}
		await syncCopies(tx, current.bookId);
		offer = await offerCopyToWaiter(tx, current.bookId);
	});
	await refreshCatalog({ bookId: current.bookId });
	await notifyHoldReady(offer);
	return ok();
}

export async function deleteLoan(id: string): Promise<DeskResult> {
	const current = await db
		.select()
		.from(loan)
		.where(eq(loan.id, id))
		.then((rows) => rows[0]);
	if (!current) return fail('Výpožička sa nenašla.');

	await db.transaction(async (tx) => {
		if (!current.returnedAt && current.holdingId) {
			await tx.update(holding).set({ status: 'available' }).where(eq(holding.id, current.holdingId));
		}
		await tx.delete(loan).where(eq(loan.id, id));
		if (!current.returnedAt) await syncCopies(tx, current.bookId);
	});
	await refreshCatalog({ bookId: current.bookId });
	return ok();
}
