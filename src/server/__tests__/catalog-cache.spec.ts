import { afterEach, describe, expect, it } from 'vitest';
import { invalidateCatalogCache, patchCachedCopies, setCatalogCache } from '../catalog-cache';
import type { CatalogBook } from '@/types';

const book = (id: string, copiesAvailable: number): CatalogBook => ({
	id,
	title: id,
	subtitle: null,
	year: 2020,
	pages: 100,
	isbn: id,
	description: 'Učebnica.',
	callNumber: 'INF 1',
	copiesTotal: 3,
	copiesAvailable,
	publisher: 'SPŠT',
	featured: false,
	coverUrl: null,
	category: { id: 'cat-inf', name: 'Informatika', slug: 'informatika', code: 'INF', accent: '#2c4a3e' },
	authors: []
});

afterEach(() => {
	invalidateCatalogCache();
});

describe('catalog cache', () => {
	it('patches available copies and the hall total', () => {
		const first = book('book-a', 2);
		const second = book('book-b', 1);
		setCatalogCache({
			books: [first, second],
			byId: new Map([
				[first.id, first],
				[second.id, second]
			]),
			categories: [],
			authors: [],
			stats: { books: 2, authors: 0, available: 3 }
		});

		expect(patchCachedCopies('book-a', 1)).toBe(true);
		expect(first.copiesAvailable).toBe(1);
		expect(patchCachedCopies('missing', 0)).toBe(false);
	});

	it('returns false when the snapshot is empty', () => {
		expect(patchCachedCopies('book-a', 1)).toBe(false);
	});
});
