import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CatalogBook } from '@/types';
import { invalidateCatalogCache, setCatalogCache } from '../catalog-cache';
import { ftsBookIds } from '../db/catalog-fts';

vi.mock('../db', () => ({ db: {} }));

vi.mock('../db/catalog-fts', () => ({
	ftsBookIds: vi.fn(() => Promise.resolve([]))
}));

import {
	getAuthor,
	getBook,
	getCategory,
	getFeaturedBook,
	isLoanLimitReached,
	listBookSlips,
	listBooks,
	listHallDesk,
	listBooksByAuthor,
	listBooksByCategory,
	relatedBooks,
	searchCatalog,
	toSearchItem,
	toSlip
} from '../library';

const category = {
	id: 'cat-str',
	name: 'Strojárstvo',
	slug: 'strojarstvo',
	description: 'Dielňa.',
	code: 'STR',
	accent: '#3d2a1c',
	bookCount: 2
};

const author = {
	id: 'a1',
	name: 'Ján Test',
	slug: 'jan-test',
	bio: 'Učiteľ.',
	lifespan: '',
	role: 'autor',
	bookCount: 2
};

const book = (
	id: string,
	opts: Partial<CatalogBook> & { slug?: string; featured?: boolean } = {}
): CatalogBook => ({
	id,
	title: opts.title ?? id,
	subtitle: null,
	year: 2020,
	pages: 100,
	isbn: opts.isbn ?? id,
	description: 'Učebnica.',
	callNumber: opts.callNumber ?? 'STR 12',
	copiesTotal: 2,
	copiesAvailable: opts.copiesAvailable ?? 1,
	publisher: 'SPŠT',
	featured: opts.featured ?? false,
	coverUrl: null,
	category: {
		...category,
		id: opts.slug === 'informatika' ? 'cat-inf' : category.id,
		slug: opts.slug ?? 'strojarstvo'
	},
	authors: [{ id: 'a1', name: 'Ján Test', slug: 'jan-test', position: 0 }]
});

function seed(books: CatalogBook[]) {
	setCatalogCache({
		books,
		byId: new Map(books.map((item) => [item.id, item])),
		categories: [category],
		authors: [author],
		stats: {
			books: books.length,
			authors: 1,
			available: books.reduce((sum, item) => sum + item.copiesAvailable, 0)
		}
	});
}

afterEach(() => {
	invalidateCatalogCache();
	vi.mocked(ftsBookIds).mockResolvedValue([]);
});

describe('isLoanLimitReached', () => {
	it('has no cap on open slips', () => {
		expect(isLoanLimitReached(0)).toBe(false);
		expect(isLoanLimitReached(99)).toBe(false);
	});
});

describe('catalog listings', () => {
	it('filters by title, call number, isbn, and author', async () => {
		seed([
			book('stroje-1', { title: 'Stroje', callNumber: 'STR 12', isbn: '978000' }),
			book('inf-1', { title: 'Siete', slug: 'informatika', isbn: '111', callNumber: 'INF 1' })
		]);

		expect((await listBooks('stroje')).map((item) => item.id)).toEqual(['stroje-1']);
		expect((await listBooks('STR 12')).map((item) => item.id)).toEqual(['stroje-1']);
		expect((await listBooks('978000')).map((item) => item.id)).toEqual(['stroje-1']);
		expect((await listBooks('ján')).map((item) => item.id)).toHaveLength(2);
		expect(await listBookSlips()).toHaveLength(2);
	});

	it('packs the hall desk without every slip', async () => {
		seed([
			book('book-modlitbicky'),
			book('stroje-1', { title: 'Stroje' }),
			book('inf-1', { title: 'Siete', slug: 'informatika' })
		]);
		const hall = await listHallDesk();
		expect(hall.shelf.map((item) => item.id)).toEqual(['stroje-1', 'inf-1']);
		expect(hall.books).toHaveLength(2);
		expect(hall.stats.books).toBe(3);
	});

	it('skips the prayer booklet when picking a featured card', async () => {
		seed([book('book-modlitbicky', { featured: true }), book('stroje-1')]);

		expect((await getFeaturedBook())?.id).toBe('stroje-1');
		expect((await getBook('stroje-1'))?.title).toBe('stroje-1');
	});

	it('prefers an explicit featured card', async () => {
		seed([book('stroje-1'), book('inf-1', { featured: true, slug: 'informatika' })]);

		expect((await getFeaturedBook())?.id).toBe('inf-1');
	});

	it('lists by odbor and author and related cards', async () => {
		seed([book('stroje-1'), book('stroje-2'), book('inf-1', { slug: 'informatika' })]);

		expect((await listBooksByCategory('strojarstvo')).map((item) => item.id)).toEqual([
			'stroje-1',
			'stroje-2'
		]);
		expect(await listBooksByAuthor('jan-test')).toHaveLength(3);
		expect((await relatedBooks('stroje-1', 'cat-str')).map((item) => item.id)).toEqual([
			'stroje-2'
		]);
		expect((await getCategory('strojarstvo'))?.name).toBe('Strojárstvo');
		expect((await getAuthor('jan-test'))?.name).toBe('Ján Test');
	});
});

describe('searchCatalog', () => {
	it('falls back to substring search when FTS is empty', async () => {
		seed([book('stroje-1', { title: 'Stroje' }), book('siete-1', { title: 'Siete' })]);

		const items = await searchCatalog('stroje', 8);

		expect(ftsBookIds).toHaveBeenCalledWith('stroje', 8);
		expect(items.map((item) => item.id)).toEqual(['stroje-1']);
		expect(items[0]).toMatchObject({
			title: 'Stroje',
			authors: 'Ján Test',
			category: 'Strojárstvo'
		});
	});

	it('keeps FTS rank when ids come back', async () => {
		seed([book('a'), book('b'), book('c')]);
		vi.mocked(ftsBookIds).mockResolvedValue(['c', 'a']);

		expect((await searchCatalog('x')).map((item) => item.id)).toEqual(['c', 'a']);
	});

	it('returns nothing for a blank query', async () => {
		expect(await searchCatalog('  ')).toEqual([]);
	});
});

describe('toSearchItem', () => {
	it('accepts a category string on a slip', () => {
		expect(
			toSearchItem({
				...toSlip(book('stroje-1')),
				category: 'Strojárstvo',
				isbn: '978'
			})
		).toMatchObject({ category: 'Strojárstvo', isbn: '978' });
	});
});
