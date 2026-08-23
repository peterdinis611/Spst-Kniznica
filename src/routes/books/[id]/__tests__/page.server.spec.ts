import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { borrowBook, getActiveLoan, getBook, getLastBorrower, countActiveLoans, relatedBookSlips } from '$lib/server/library';
import { actions, load } from '../+page.server';

vi.mock('$lib/server/library', () => ({
	MAX_ACTIVE_LOANS: null,
	borrowBook: vi.fn(),
	getActiveLoan: vi.fn(),
	getBook: vi.fn(),
	getLastBorrower: vi.fn(),
	countActiveLoans: vi.fn(),
	relatedBookSlips: vi.fn()
}));

const reader = { id: 'user-509a', name: 'Peter Dinis', email: 'peter@spst.sk' };

const book = {
	id: 'stroje-1',
	title: 'Stroje',
	subtitle: null,
	year: 2020,
	pages: 120,
	isbn: '978000',
	description: 'Učebnica.',
	callNumber: 'STR 12',
	copiesTotal: 2,
	copiesAvailable: 1,
	publisher: 'SPŠT',
	featured: false,
	category: {
		id: 'cat-str',
		name: 'Strojárstvo',
		slug: 'strojarstvo',
		code: 'STR',
		accent: '#3d2a1c'
	},
	authors: [{ id: 'a1', name: 'Ján Test', slug: 'jan-test', position: 0 }]
};

describe('book card load', () => {
	beforeEach(() => {
		vi.mocked(getBook).mockReturnValue(book);
		vi.mocked(relatedBookSlips).mockReturnValue([]);
		vi.mocked(getActiveLoan).mockReturnValue(undefined);
		vi.mocked(countActiveLoans).mockReturnValue(0);
		vi.mocked(getLastBorrower).mockReturnValue(null);
	});

	it('prefills the slip from the account name', async () => {
		const data = await load({
			params: { id: 'stroje-1' },
			locals: { user: reader }
		} as Parameters<typeof load>[0]);

		expect(data.borrower).toEqual({
			firstName: 'Peter',
			lastName: 'Dinis',
			className: '',
			days: 21
		});
	});
});

describe('book borrow action', () => {
	beforeEach(() => {
		vi.mocked(borrowBook).mockReset();
	});

	function event(user: typeof reader | undefined, body: Record<string, string> = {}) {
		return {
			locals: { user },
			params: { id: 'stroje-1' },
			request: {
				formData: async () => {
					const data = new FormData();
					for (const [key, value] of Object.entries(body)) data.set(key, value);
					return data;
				}
			}
		} as unknown as Parameters<NonNullable<typeof actions.borrow>>[0];
	}

	it('sends anonymous borrows to login', async () => {
		try {
			await actions.borrow?.(event(undefined));
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/login');
		}
	});

	it('rejects an empty slip', async () => {
		const result = await actions.borrow?.(event(reader));

		expect(borrowBook).not.toHaveBeenCalled();
		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.data).toMatchObject({ message: 'Doplň výpožičný lístok.' });
		}
	});

	it('stamps a completed slip', async () => {
		vi.mocked(borrowBook).mockReturnValue({ ok: true, dueAt: new Date(2026, 8, 13) });

		const result = await actions.borrow?.(
			event(reader, {
				firstName: 'Peter',
				lastName: 'Dinis',
				className: 'ii.a',
				days: '21'
			})
		);

		expect(borrowBook).toHaveBeenCalledWith(reader.id, 'stroje-1', {
			firstName: 'Peter',
			lastName: 'Dinis',
			className: 'II.A',
			days: 21
		});
		expect(result).toEqual({
			stamp: 'Vypožičané',
			sub: expect.stringMatching(/13\.\s?09\.\s?2026/)
		});
	});

	it('accepts a custom period', async () => {
		vi.mocked(borrowBook).mockReturnValue({ ok: true, dueAt: new Date(2026, 8, 22) });

		const result = await actions.borrow?.(
			event(reader, {
				firstName: 'Peter',
				lastName: 'Dinis',
				className: 'II.A',
				days: '30'
			})
		);

		expect(borrowBook).toHaveBeenCalledWith(reader.id, 'stroje-1', {
			firstName: 'Peter',
			lastName: 'Dinis',
			className: 'II.A',
			days: 30
		});
		expect(result).toMatchObject({ stamp: 'Vypožičané' });
	});
});
