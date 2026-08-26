import { describe, expect, it, vi } from 'vitest';
import { catalogStats, listAuthorSlips, listBookSlips, toSearchItem } from '$lib/server/library';
import { load } from '../+page.server';

vi.mock('$lib/server/library', () => ({
	catalogStats: vi.fn(),
	listAuthorSlips: vi.fn(),
	listBookSlips: vi.fn(),
	toSearchItem: vi.fn((item: { id: string; title: string }) => ({
		id: item.id,
		title: item.title,
		authors: 'Ján Test',
		callNumber: 'STR 12',
		category: 'Strojárstvo',
		isbn: '',
		copiesAvailable: 1,
		coverUrl: null
	}))
}));

const slip = (id: string, copiesAvailable = 1) => ({
	id,
	title: id,
	callNumber: 'STR 12',
	copiesTotal: 2,
	copiesAvailable,
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

describe('hall load', () => {
	it('hides the prayer booklet and previews ready copies', async () => {
		vi.mocked(listBookSlips).mockResolvedValue([
			slip('book-modlitbicky'),
			slip('ready-1'),
			slip('gone-1', 0)
		]);
		vi.mocked(listAuthorSlips).mockResolvedValue([
			{ id: 'a1', name: 'A', slug: 'a', lifespan: '', role: 'autor', bookCount: 3 }
		]);
		vi.mocked(catalogStats).mockResolvedValue({ books: 2, authors: 1, available: 1, openLoans: 0 });

		const data = await load({} as Parameters<typeof load>[0]);

		expect(data.books.map((book) => book.id)).toEqual(['ready-1']);
		expect(data.shelf.map((book) => book.id)).toEqual(['ready-1', 'gone-1']);
		expect(data.searchPreview[0].id).toBe('ready-1');
		expect(toSearchItem).toHaveBeenCalled();
		expect(data.authors[0].slug).toBe('a');
	});
});
