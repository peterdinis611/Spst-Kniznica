import { describe, expect, it, vi } from 'vitest';
import { catalogStats, getFeaturedBook, listAuthorSlips, listBookSlips } from '$lib/server/library';
import { load } from '../+page.server';

vi.mock('$lib/server/library', () => ({
	catalogStats: vi.fn(),
	getFeaturedBook: vi.fn(),
	listAuthorSlips: vi.fn(),
	listBookSlips: vi.fn()
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

describe('discover load', () => {
	it('keeps the featured card off the shelf and ranks authors', async () => {
		const featured = {
			...slip('featured-1'),
			subtitle: null,
			year: 2020,
			pages: 100,
			isbn: '',
			description: '',
			publisher: 'SPŠT',
			featured: true
		};
		vi.mocked(getFeaturedBook).mockReturnValue(featured);
		vi.mocked(listBookSlips).mockReturnValue([
			slip('featured-1'),
			slip('ready-1'),
			slip('gone-1', 0)
		]);
		vi.mocked(listAuthorSlips).mockReturnValue([
			{ id: 'a2', name: 'B', slug: 'b', lifespan: '', role: 'autor', bookCount: 1 },
			{ id: 'a1', name: 'A', slug: 'a', lifespan: '', role: 'autor', bookCount: 4 }
		]);
		vi.mocked(catalogStats).mockReturnValue({ books: 3, authors: 2, available: 2, openLoans: 1 });

		const data = await load({} as Parameters<typeof load>[0]);

		expect(data.featured).toEqual(featured);
		expect(data.books.map((book) => book.id)).toEqual(['ready-1']);
		expect(data.authors.map((author) => author.slug)).toEqual(['a', 'b']);
		expect(data.stats.openLoans).toBe(1);
	});
});
