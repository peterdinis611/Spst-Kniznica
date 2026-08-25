import { isActionFailure } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bookOptions, deleteLoan, getDeskLoan, listDeskLoans, readerOptions, returnDeskLoan, saveLoan } from '$lib/server/admin-desk';
import { queueLoanNotice } from '$lib/server/loan-mail';
import { actions, load } from '../+page.server';

vi.mock('$lib/server/admin-desk', () => ({
	listDeskLoans: vi.fn(),
	getDeskLoan: vi.fn(),
	bookOptions: vi.fn(),
	readerOptions: vi.fn(),
	saveLoan: vi.fn(),
	returnDeskLoan: vi.fn(),
	deleteLoan: vi.fn()
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
		}
	} as unknown as Parameters<NonNullable<typeof actions.save>>[0];
}

describe('admin vypozicky load', () => {
	it('picks the edited slip', async () => {
		vi.mocked(listDeskLoans).mockReturnValue([
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
		vi.mocked(bookOptions).mockReturnValue([]);
		vi.mocked(readerOptions).mockReturnValue([]);

		const data = (await load({
			url: new URL('http://localhost/admin/loans?edit=loan-1')
		} as Parameters<typeof load>[0])) as { current: { id: string } | null };

		expect(data.current?.id).toBe('loan-1');
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
		vi.mocked(getDeskLoan).mockReturnValue({
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
			readerName: 'Peter Dinis',
			readerEmail: 'peter@spst.sk'
		});
		vi.mocked(returnDeskLoan).mockReturnValue({ ok: true });
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
		vi.mocked(returnDeskLoan).mockReturnValue({ ok: false, message: 'Výpožička sa nenašla.' });
		const result = await actions.return?.(event({ id: 'missing' }));
		expect(isActionFailure(result)).toBe(true);
	});

	it('stamps a deleted slip', async () => {
		vi.mocked(deleteLoan).mockReturnValue({ ok: true });
		expect(await actions.delete?.(event({ id: 'loan-1' }))).toEqual({ stamp: 'Zmazané' });
	});
});
