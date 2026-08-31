import { describe, expect, it, vi } from 'vitest';
import { pageOf } from '$lib/page-of';
import { findScanHit } from '$lib/server/desk/scan';
import { getDeskLoan, returnDeskLoan, saveLoan } from '$lib/server/desk/loans';
import { readerOptions } from '$lib/server/desk/options';
import { actions, load } from '../+page.server';

vi.mock('$lib/server/desk/scan', () => ({
	findScanHit: vi.fn()
}));

vi.mock('$lib/server/desk/loans', () => ({
	getDeskLoan: vi.fn(),
	returnDeskLoan: vi.fn(),
	saveLoan: vi.fn()
}));

vi.mock('$lib/server/desk/options', () => ({
	readerOptions: vi.fn()
}));

vi.mock('$lib/server/library', () => ({
	getBook: vi.fn()
}));

vi.mock('$lib/server/loan-mail', () => ({
	queueLoanNotice: vi.fn()
}));

describe('admin scan load', () => {
	it('looks up a code from the gun', async () => {
		vi.mocked(findScanHit).mockResolvedValue({
			kind: 'borrow',
			copy: {
				id: 'h-1',
				inventoryNo: 'INF-ALGO-01',
				status: 'available',
				bookId: 'book-1',
				title: 'Algoritmy',
				isbn: '97880',
				callNumber: 'INF 004'
			}
		});
		vi.mocked(readerOptions).mockResolvedValue([]);

		const data = pageOf(
			await load({
				url: new URL('http://localhost/admin/scan?code=INF-ALGO-01')
			} as Parameters<typeof load>[0])
		);

		expect(findScanHit).toHaveBeenCalledWith('INF-ALGO-01');
		expect(data.hit?.kind).toBe('borrow');
	});

	it('skips the drawer when the pad is blank', async () => {
		const data = pageOf(
			await load({
				url: new URL('http://localhost/admin/scan')
			} as Parameters<typeof load>[0])
		);
		expect(data.hit).toBeNull();
		expect(data.code).toBe('');
	});
});

describe('admin scan return', () => {
	it('stamps a return from the pad', async () => {
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

		const result = await actions.return?.({
			request: {
				formData: async () => {
					const body = new FormData();
					body.set('id', 'loan-1');
					return body;
				}
			}
		} as Parameters<NonNullable<typeof actions.return>>[0]);

		expect(result).toEqual({ stamp: 'Vrátené' });
		expect(saveLoan).not.toHaveBeenCalled();
	});
});
