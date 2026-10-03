import { and, eq, isNull } from 'drizzle-orm';
import { MAX_RENEWALS } from '@/catalog/hold';
import { normalizeClass } from '@/desk/borrow-fields';
import type { SignedReader } from '@/types';
import { db } from '../db';
import { book, loan, user } from '../db/schema';
import { waitingBookIds } from '../waitlist';
import { canStampClass } from './class-gate';

export { canStampClass };

export type ClassSlipResult =
	| { ok: true; kind: 'renew'; dueAt: Date; title: string; readerName: string; email: string }
	| { ok: true; kind: 'pull'; already: boolean; title: string; readerName: string; email: string }
	| { ok: false; message: string };

async function openClassLoan(loanId: string, klass: string) {
	const seen = normalizeClass(klass);
	if (!loanId || !seen) return null;
	return db
		.select({
			id: loan.id,
			userId: loan.userId,
			bookId: loan.bookId,
			dueAt: loan.dueAt,
			loanDays: loan.loanDays,
			renewalCount: loan.renewalCount,
			returnedAt: loan.returnedAt,
			returnOfferedAt: loan.returnOfferedAt,
			klass: loan.borrowerClass,
			title: book.title,
			callNumber: book.callNumber,
			readerName: user.name,
			email: user.email
		})
		.from(loan)
		.innerJoin(book, eq(book.id, loan.bookId))
		.innerJoin(user, eq(user.id, loan.userId))
		.where(and(eq(loan.id, loanId), eq(loan.borrowerClass, seen), isNull(loan.returnedAt)))
		.then((rows) => rows[0] ?? null);
}

export async function renewClassSlip(
	actor: SignedReader,
	loanId: string,
	klass: string
): Promise<ClassSlipResult> {
	if (!canStampClass(actor, klass)) return { ok: false, message: 'Túto triedu nepečiatkuješ.' };
	const current = await openClassLoan(loanId, klass);
	if (!current) return { ok: false, message: 'Lístok triedy sa nenašiel.' };
	if (current.returnOfferedAt) {
		return { ok: false, message: 'Kniha je nahlásená na pult. Predĺžiť sa nedá.' };
	}
	if (current.renewalCount >= MAX_RENEWALS) {
		return { ok: false, message: 'Tento lístok už je predĺžený.' };
	}
	const waiting = await waitingBookIds([current.bookId]);
	if (waiting.has(current.bookId)) {
		return { ok: false, message: 'Na zväzok čaká iný čitateľ. Predĺžiť sa nedá.' };
	}

	const dueAt = new Date(current.dueAt.getTime() + current.loanDays * 24 * 60 * 60 * 1000);
	await db
		.update(loan)
		.set({ dueAt, renewalCount: current.renewalCount + 1 })
		.where(eq(loan.id, current.id));

	return {
		ok: true,
		kind: 'renew',
		dueAt,
		title: current.title,
		readerName: current.readerName,
		email: current.email
	};
}

export async function pullClassSlip(
	actor: SignedReader,
	loanId: string,
	klass: string
): Promise<ClassSlipResult> {
	if (!canStampClass(actor, klass)) return { ok: false, message: 'Túto triedu nepečiatkuješ.' };
	const current = await openClassLoan(loanId, klass);
	if (!current) return { ok: false, message: 'Lístok triedy sa nenašiel.' };
	if (current.returnOfferedAt) {
		return {
			ok: true,
			kind: 'pull',
			already: true,
			title: current.title,
			readerName: current.readerName,
			email: current.email
		};
	}

	await db.update(loan).set({ returnOfferedAt: new Date() }).where(eq(loan.id, current.id));
	return {
		ok: true,
		kind: 'pull',
		already: false,
		title: current.title,
		readerName: current.readerName,
		email: current.email
	};
}
