import { describe, expect, it, vi } from 'vitest';
import { listBookSlips, listCategories } from '$lib/server/library';
import { load } from '../+page.server';

vi.mock('$lib/server/library', () => ({
	listBookSlips: vi.fn(),
	listCategories: vi.fn()
}));

const category = {
	id: 'cat-str',
	name: 'Strojárstvo',
	slug: 'strojarstvo',
	description: 'Dielňa.',
	code: 'STR',
	accent: '#3d2a1c',
	bookCount: 2
};

const slip = (id: string, slug = 'strojarstvo') => ({
	id,
	title: id,
	callNumber: 'STR 12',
	copiesTotal: 2,
	copiesAvailable: 1,
	coverUrl: null,
	category: {
		id: 'cat-str',
		name: 'Strojárstvo',
		slug,
		code: 'STR',
		accent: '#3d2a1c'
	},
	authors: [{ id: 'a1', name: 'Ján Test', slug: 'jan-test', position: 0 }]
});

describe('departments load', () => {
	it('pins four books on each department card', async () => {
		vi.mocked(listCategories).mockResolvedValue([category]);
		vi.mocked(listBookSlips).mockResolvedValue([
			slip('book-modlitbicky'),
			slip('a'),
			slip('b'),
			slip('c'),
			slip('d'),
			slip('e'),
			slip('inf-1', 'informatika')
		]);

		const data = await load({} as Parameters<typeof load>[0]);

		expect(data.categories).toHaveLength(1);
		expect(data.categories[0].books.map((book) => book.id)).toEqual(['a', 'b', 'c', 'd']);
	});
});
