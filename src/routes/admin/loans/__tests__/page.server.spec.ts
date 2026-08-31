import { isActionFailure } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteLoan, getDeskLoan, listDeskClasses, listDeskLoans, returnDeskLoan, saveLoan } from '$lib/server/desk/loans';
import { bookOptions, readerOptions } from '$lib/server/desk/options';
import { queueLoanNotice } from '$lib/server/loan-mail';
import { actions, load } from '../+page.server';

vi.mock('$lib/server/desk/loans', () => ({
	listDeskLoans: vi.fn(),
	listDeskClasses: vi.fn(),
	parseDeskLoanFilter: (url: URL) => ({
		q: url.searchParams.get('q') ?? '',
		klass: (url.searchParams.get('class') ?? '').trim().replace(/\s+/g, '').toUpperCase(),
		open: url.searchParams.get('open') === '1'
	}),
	getDeskLoan: vi.fn(),
	saveLoan: vi.fn(),
	returnDeskLoan: vi.fn(),
	deleteLoan: vi.fn()
}));

vi.mock('$lib/server/desk/options', () => ({
	bookOptions: vi.fn(),
	readerOptions: vi.fn()
}));

vi.mock('$lib/server/loan-mail', () => ({
	queueLoanNotice: vi.fn()
}));

vi.mock('$lib/server/library', () => ({
	getBook: vi.fn()
}));

function event(fields: Record<string, string>) {
	return {
		request: {
			formData: async () => {
				const body = new FormData();
				for (const [key, value] of Object.entries(fields)) body.set(key, value);
				return body;
			}
		},
		locals: { user: { id: 'u1', name: 'Anna', email: 'anna@spst.sk', role: 'librarian' as const } }
	} as unknown as Parameters<NonNullable<typeof actions.save>>[0];
}

describe('admin vypozicky load', () => {
	it('picks the edited slip', async () => {
		vi.mocked(listDeskLoans).mockResolvedValue([
			{
				id: 'loan-1',
				bookId: 'book-1',
				holdingId: 'h-1',
				userId: 'user-1',
				borrowedAt: new Date(),
				dueAt: new Date(),
				returnedAt: null,
				renewalCount: 0,
				borrowerFirstName: 'Peter',
				borrowerLastName: 'Dinis',
				borrowerClass: 'II.A',
				loanDays: 21,
				bookTitle: 'Algoritmy',
				readerName: 'Peter',
				readerEmail: 'peter@spst.sk'
			}
		]);
		vi.mocked(listDeskClasses).mockResolvedValue(['II.A']);
		vi.mocked(bookOptions).mockResolvedValue([]);
		vi.mocked(readerOptions).mockResolvedValue([]);

		const data = (await load({
			url: new URL('http://localhost/admin/loans?edit=loan-1'),
			locals: { user: { id: 'u1', name: 'Anna', email: 'anna@spst.sk', role: 'librarian' } }
		} as Parameters<typeof load>[0])) as { current: { id: string } | null };

		expect(data.current?.id).toBe('loan-1');
	});

	it('asks the drawer for a class that is still out', async () => {
		vi.mocked(listDeskLoans).mockResolvedValue([]);
		vi.mocked(listDeskClasses).mockResolvedValue(['II.A']);
		vi.mocked(bookOptions).mockResolvedValue([]);
		vi.mocked(readerOptions).mockResolvedValue([]);

		const data = (await load({
			url: new URL('http://localhost/admin/loans?class=ii.a&open=1'),
			locals: { user: { id: 'u1', name: 'Anna', email: 'anna@spst.sk', role: 'librarian' } }
		} as Parameters<typeof load>[0])) as { klass: string; open: boolean };

		expect(listDeskLoans).toHaveBeenCalledWith({ q: '', klass: 'II.A', open: true });
		expect(data.klass).toBe('II.A');
		expect(data.open).toBe(true);
	});

	it('asks a teacher for a class before listing slips', async () => {
		vi.mocked(listDeskClasses).mockResolvedValue(['II.A']);
		vi.mocked(listDeskLoans).mockClear();

		const data = (await load({
			url: new URL('http://localhost/admin/loans'),
			locals: { user: { id: 't1', name: 'Eva', email: 'eva@spst.sk', role: 'teacher' } }
		} as Parameters<typeof load>[0])) as { rows: unknown[]; manage: boolean };

		expect(data.manage).toBe(false);
		expect(data.rows).toEqual([]);
		expect(listDeskLoans).not.toHaveBeenCalled();
	});

	it('opens the teacher class from the pass', async () => {
		vi.mocked(listDeskLoans).mockResolvedValue([]);
		vi.mocked(listDeskClasses).mockResolvedValue(['II.A']);
		vi.mocked(bookOptions).mockResolvedValue([]);
		vi.mocked(readerOptions).mockResolvedValue([]);

		const data = (await load({
			url: new URL('http://localhost/admin/loans'),
			locals: {
				user: { id: 't1', name: 'Eva', email: 'eva@spst.sk', role: 'teacher', className: 'II.A' }
			}
		} as Parameters<typeof load>[0])) as { klass: string; open: boolean };

		expect(listDeskLoans).toHaveBeenCalledWith({ q: '', klass: 'II.A', open: true });
		expect(data.klass).toBe('II.A');
		expect(data.open).toBe(true);
	});
});

describe('admin vypozicky actions', () => {
	beforeEach(() => {
		vi.mocked(saveLoan).mockReset();
		vi.mocked(returnDeskLoan).mockReset();
		vi.mocked(deleteLoan).mockReset();
		vi.mocked(queueLoanNotice).mockReset();
		vi.mocked(getDeskLoan).mockReset();
	});

	it('stamps a desk return', async () => {
		vi.mocked(getDeskLoan).mockResolvedValue({
			id: 'loan-1',
			bookId: 'book-1',
			holdingId: 'h-1',
			userId: 'user-1',
			borrowedAt: new Date(),
			dueAt: new Date(),
			returnedAt: null,
			renewalCount: 0,
			borrowerFirstName: 'Peter',
			borrowerLastName: 'Dinis',
			borrowerClass: 'II.A',
			loanDays: 21,
			bookTitle: 'Algoritmy',
			callNumber: 'INF 004.4 ALG',
			readerName: 'Peter Dinis',
			readerEmail: 'peter@spst.sk'
		});
		vi.mocked(returnDeskLoan).mockResolvedValue({ ok: true });
		expect(await actions.return?.(event({ id: 'loan-1' }))).toEqual({ stamp: 'Vrátené' });
		expect(returnDeskLoan).toHaveBeenCalledWith('loan-1');
		expect(queueLoanNotice).toHaveBeenCalledWith(
			expect.objectContaining({
				kind: 'return',
				to: 'peter@spst.sk',
				bookTitle: 'Algoritmy'
			})
		);
	});

	it('returns a missing slip as a failure', async () => {
		vi.mocked(returnDeskLoan).mockResolvedValue({ ok: false, message: 'Výpožička sa nenašla.' });
		const result = await actions.return?.(event({ id: 'missing' }));
		expect(isActionFailure(result)).toBe(true);
	});

	it('stamps a deleted slip', async () => {
		vi.mocked(deleteLoan).mockResolvedValue({ ok: true });
		expect(await actions.delete?.(event({ id: 'loan-1' }))).toEqual({ stamp: 'Zmazané' });
	});

	it('mails a new due date when the desk repairs the term', async () => {
		const dueAt = new Date('2026-09-13T12:00:00Z');
		const nextDue = new Date('2026-09-20T12:00:00Z');
		vi.mocked(getDeskLoan).mockResolvedValue({
			id: 'loan-1',
			bookId: 'book-1',
			holdingId: 'h-1',
			userId: 'user-1',
			borrowedAt: new Date('2026-08-23T12:00:00Z'),
			dueAt,
			returnedAt: null,
			renewalCount: 0,
			borrowerFirstName: 'Peter',
			borrowerLastName: 'Dinis',
			borrowerClass: 'II.A',
			loanDays: 21,
			bookTitle: 'Algoritmy',
			callNumber: 'INF 004.4 ALG',
			readerName: 'Peter Dinis',
			readerEmail: 'peter@spst.sk'
		});
		vi.mocked(saveLoan).mockResolvedValue({ ok: true });
		expect(
			await actions.save?.(
				event({
					id: 'loan-1',
					bookId: 'book-1',
					userId: 'user-1',
					borrowerFirstName: 'Peter',
					borrowerLastName: 'Dinis',
					borrowerClass: 'II.A',
					loanDays: '21',
					dueAt: nextDue.toISOString()
				})
			)
		).toEqual({ stamp: 'Uložené' });
		expect(queueLoanNotice).toHaveBeenCalledWith(
			expect.objectContaining({
				kind: 'dueChanged',
				to: 'peter@spst.sk',
				bookTitle: 'Algoritmy',
				dueAt: nextDue
			})
		);
	});

	it('keeps a teacher from returning a slip', async () => {
		const result = await actions.return?.({
			...event({ id: 'loan-1' }),
			locals: { user: { id: 't1', name: 'Eva', email: 'eva@spst.sk', role: 'teacher' } }
		} as Parameters<NonNullable<typeof actions.return>>[0]);
		expect(isActionFailure(result)).toBe(true);
		expect(returnDeskLoan).not.toHaveBeenCalled();
	});
});
