import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../index', () => ({
	db: { execute: vi.fn() }
}));

import { db } from '../index';
import {
	catalogTsQuery,
	deleteBookFts,
	ensureCatalogFts,
	ftsBookIds,
	rebuildCatalogFts,
	upsertBookFts
} from '../catalog-fts';

describe('catalogTsQuery', () => {
	it('builds a prefix query and drops markup', () => {
		expect(catalogTsQuery('  Algoritmy v dielni ')).toBe('algoritmy:* & v:* & dielni:*');
		expect(catalogTsQuery(`O'Neil & (C++)`)).toBe('o:* & neil:* & c++:*');
		expect(catalogTsQuery('   ')).toBeNull();
	});
});

describe('catalog fts store', () => {
	beforeEach(() => {
		vi.mocked(db.execute).mockReset();
	});

	it('rebuilds when the store is empty', async () => {
		vi.mocked(db.execute)
			.mockResolvedValueOnce([{ c: 0 }] as never)
			.mockResolvedValue([] as never);
		await ensureCatalogFts();
		expect(db.execute).toHaveBeenCalledTimes(3);
	});

	it('skips a rebuild when the store already has cards', async () => {
		vi.mocked(db.execute).mockResolvedValueOnce([{ c: 20 }] as never);
		await ensureCatalogFts();
		expect(db.execute).toHaveBeenCalledTimes(1);
	});

	it('upserts one card and deletes a missing one', async () => {
		vi.mocked(db.execute).mockResolvedValue([] as never);
		await upsertBookFts('book-1');
		await deleteBookFts('book-1');
		await rebuildCatalogFts();
		expect(db.execute).toHaveBeenCalled();
	});

	it('returns ranked ids from the gin store', async () => {
		vi.mocked(db.execute).mockResolvedValue([{ id: 'book-2' }, { id: 'book-1' }] as never);
		await expect(ftsBookIds('algoritmy')).resolves.toEqual(['book-2', 'book-1']);
	});

	it('swallows a missing store', async () => {
		vi.mocked(db.execute).mockRejectedValue(new Error('relation "book_fts" does not exist'));
		await expect(ftsBookIds('stroje')).resolves.toEqual([]);
	});
});
