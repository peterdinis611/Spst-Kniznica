import { describe, expect, it, vi } from 'vitest';
import { listBookSlips } from '$lib/server/library';
import { load } from '../+page.server';

vi.mock('$lib/server/library', () => ({
	listBookSlips: vi.fn()
}));

const slip = (id: string) => ({
	id,
	title: id,
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
});

describe('holdings load', () => {
	it('hides the prayer booklet from the full shelf', async () => {
		vi.mocked(listBookSlips).mockResolvedValue([slip('book-modlitbicky'), slip('stroje-1')]);

		const data = await load({} as Parameters<typeof load>[0]);

		expect(data.books.map((book) => book.id)).toEqual(['stroje-1']);
	});
});
