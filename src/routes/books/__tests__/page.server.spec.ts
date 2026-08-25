import { describe, expect, it, vi } from 'vitest';
import { listBookSlips } from '$lib/server/library';
import { load } from '../+page.server';

vi.mock('$lib/server/library', () => ({
	listBookSlips: vi.fn()
}));

const slip = {
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

describe('books catalog load', () => {
	it('passes the query through and filters by odbor', async () => {
		vi.mocked(listBookSlips).mockReturnValue([
			slip,
			{ ...slip, id: 'inf-1', title: 'Algoritmy', category: { ...slip.category, slug: 'informatika' } }
		]);

		const data = await load({
			url: new URL('http://localhost/books?q=stroje&odbor=strojarstvo')
		} as Parameters<typeof load>[0]);

		expect(listBookSlips).toHaveBeenCalledWith('stroje');
		expect(data.q).toBe('stroje');
		expect(data.odbor).toBe('strojarstvo');
		expect(data.books).toEqual([slip]);
	});

	it('lists the whole tray when the query is empty', async () => {
		vi.mocked(listBookSlips).mockReturnValue([slip]);

		const data = await load({
			url: new URL('http://localhost/books')
		} as Parameters<typeof load>[0]);

		expect(listBookSlips).toHaveBeenCalledWith(undefined);
		expect(data.books).toEqual([slip]);
	});
});
