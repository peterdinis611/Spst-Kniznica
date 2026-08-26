import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LoanRecord } from '$lib/types';
import { countActiveLoans, listLoans, returnBook, clearReturnedLoans } from '$lib/server/library';
import { queueLoanNotice } from '$lib/server/loan-mail';
import { pageOf } from '$lib/page-of';
import { actions, load } from '../+page.server';

vi.mock('$lib/server/library', () => ({
	MAX_ACTIVE_LOANS: null,
	listLoans: vi.fn(),
	countActiveLoans: vi.fn(),
	returnBook: vi.fn(),
	clearReturnedLoans: vi.fn()
}));

vi.mock('$lib/server/loan-mail', () => ({
	queueLoanNotice: vi.fn()
}));

const reader = {
	id: 'user-509a',
	name: 'Peter Dinis',
	email: 'peter@spst.sk',
	role: 'reader' as const
};

const book = {
	id: 'stroje-1',
	title: 'Stroje',
	callNumber: 'STR 12',
	copiesTotal: 2,
	copiesAvailable: 1,
	coverUrl: null,
	category: {
		id: 'cat-str',
		name: 'Strojárstvo',
		slug: 'strojarstvo',
		code: 'STR',
		accent: '#3d2a1c'
	},
	authors: [{ id: 'a1', name: 'Ján Test', slug: 'jan-test', position: 0 }]
};

function loan(partial: Partial<LoanRecord> & Pick<LoanRecord, 'id' | 'returnedAt'>): LoanRecord {
	return {
		borrowedAt: new Date(2026, 7, 1),
		dueAt: new Date(2026, 7, 22),
		borrowerFirstName: 'Peter',
		borrowerLastName: 'Dinis',
		borrowerClass: 'II.A',
		loanDays: 21,
		book,
		...partial
	};
}

function localsOf(user: typeof reader | undefined) {
	return { locals: { user } } as Parameters<typeof load>[0];
}

describe('loans load', () => {
	beforeEach(() => {
		vi.mocked(listLoans).mockReset();
		vi.mocked(countActiveLoans).mockReset();
	});

	it('sends anonymous readers to login', async () => {
		try {
			await load(localsOf(undefined));
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) {
				expect(error.status).toBe(302);
				expect(error.location).toBe('/login');
			}
		}
	});

	it('splits active loans from history and exposes the reader pass', async () => {
		vi.mocked(listLoans).mockResolvedValue([
			loan({ id: 'open', returnedAt: null }),
			loan({ id: 'closed', returnedAt: new Date(2026, 7, 10), book: { ...book, title: 'Vrátená' } })
		]);
		vi.mocked(countActiveLoans).mockResolvedValue(1);

		const data = pageOf(await load(localsOf(reader)));

		expect(listLoans).toHaveBeenCalledWith(reader.id);
		expect(data.reader).toEqual(reader);
		expect(data.maxLoans).toBeNull();
		expect(data.activeCount).toBe(1);
		expect(data.loans.map((item: { id: string }) => item.id)).toEqual(['open']);
		expect(data.history.map((item: { book: { title: string } }) => item.book.title)).toEqual(['Vrátená']);
	});
});

describe('loans return action', () => {
	beforeEach(() => {
		vi.mocked(returnBook).mockReset();
		vi.mocked(queueLoanNotice).mockReset();
		vi.mocked(listLoans).mockResolvedValue([loan({ id: 'open', returnedAt: null })]);
	});

	function event(user: typeof reader | undefined, loanId = 'open') {
		return {
			locals: { user },
			request: {
				formData: async () => {
					const body = new FormData();
					body.set('loanId', loanId);
					return body;
				}
			}
		} as unknown as Parameters<NonNullable<typeof actions.return>>[0];
	}

	it('sends anonymous returns to login', async () => {
		try {
			await actions.return?.(event(undefined));
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/login');
		}
	});

	it('returns the library error as a form failure', async () => {
		vi.mocked(returnBook).mockResolvedValue({ ok: false, message: 'Výpožička sa nenašla.' });

		const result = await actions.return?.(event(reader, 'missing'));

		expect(returnBook).toHaveBeenCalledWith(reader.id, 'missing');
		expect(queueLoanNotice).not.toHaveBeenCalled();
		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.status).toBe(400);
			expect(result.data).toEqual({ message: 'Výpožička sa nenašla.' });
		}
	});

	it('stamps a successful return', async () => {
		vi.mocked(returnBook).mockResolvedValue({ ok: true });

		const result = await actions.return?.(event(reader));

		expect(result).toEqual({
			stamp: 'Vrátené',
			sub: expect.stringMatching(/\d{1,2}\.\s?\d{1,2}\.\s?2026/)
		});
		expect(queueLoanNotice).toHaveBeenCalledWith(
			expect.objectContaining({
				kind: 'return',
				to: reader.email,
				bookTitle: 'Stroje'
			})
		);
	});
});

describe('loans clearHistory action', () => {
	beforeEach(() => {
		vi.mocked(clearReturnedLoans).mockReset();
	});

	function event(user: typeof reader | undefined) {
		return { locals: { user } } as unknown as Parameters<NonNullable<typeof actions.clearHistory>>[0];
	}

	it('sends anonymous clears to login', async () => {
		try {
			await actions.clearHistory?.(event(undefined));
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/login');
		}
	});

	it('fails when there is nothing to clear', async () => {
		vi.mocked(clearReturnedLoans).mockResolvedValue({ ok: true, cleared: 0 });

		const result = await actions.clearHistory?.(event(reader));

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.data).toEqual({ message: 'Na lístku nie sú vrátené knihy.' });
		}
	});

	it('stamps a successful clear', async () => {
		vi.mocked(clearReturnedLoans).mockResolvedValue({ ok: true, cleared: 3 });

		const result = await actions.clearHistory?.(event(reader));

		expect(clearReturnedLoans).toHaveBeenCalledWith(reader.id);
		expect(result).toEqual({ stamp: 'Vyčistené', sub: 'Vrátené zmizli z lístka' });
	});
});
