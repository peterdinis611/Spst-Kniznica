import { describe, expect, it, vi } from 'vitest';

vi.mock('../db/catalog-fts', () => ({
	rebuildCatalogFts: vi.fn(),
	upsertBookFts: vi.fn(),
	deleteBookFts: vi.fn()
}));

vi.mock('../catalog-cache', () => ({
	invalidateCatalogCache: vi.fn()
}));

import {
	formBool,
	formDate,
	formInt,
	formText,
	refreshCatalog,
	uniqueConstraintMessage
} from '../admin';
import { invalidateCatalogCache } from '../catalog-cache';
import { deleteBookFts, rebuildCatalogFts, upsertBookFts } from '../db/catalog-fts';

function body(entries: Record<string, string>) {
	const data = new FormData();
	for (const [key, value] of Object.entries(entries)) data.set(key, value);
	return data;
}

describe('form helpers', () => {
	it('reads trimmed text, integers, and booleans from a slip', () => {
		const data = body({ name: '  INF  ', year: '2024', featured: '1', empty: '   ' });
		expect(formText(data, 'name')).toBe('INF');
		expect(formText(data, 'missing')).toBe('');
		expect(formInt(data, 'year')).toBe(2024);
		expect(formInt(data, 'empty')).toBeNull();
		expect(formInt(data, 'name')).toBeNull();
		expect(formBool(data, 'featured')).toBe(true);
		expect(formBool(data, 'empty')).toBe(false);
	});

	it('parses a datetime or returns null', () => {
		expect(formDate(body({ when: '2026-08-24T09:05' }), 'when')?.getFullYear()).toBe(2026);
		expect(formDate(body({ when: '' }), 'when')).toBeNull();
		expect(formDate(body({ when: 'nie' }), 'when')).toBeNull();
	});

	it('maps a unique constraint to a Slovak note', () => {
		expect(uniqueConstraintMessage(new Error('UNIQUE constraint failed: category.slug'), 'už je')).toBe(
			'už je'
		);
		expect(uniqueConstraintMessage(new Error('SQLITE_BUSY'), 'už je')).toBeNull();
	});
});

describe('refreshCatalog', () => {
	it('rebuilds the whole index or a single card', () => {
		refreshCatalog('all');
		expect(invalidateCatalogCache).toHaveBeenCalled();
		expect(rebuildCatalogFts).toHaveBeenCalled();

		refreshCatalog({ bookId: 'book-1' });
		expect(upsertBookFts).toHaveBeenCalledWith('book-1');

		refreshCatalog({ deletedBookId: 'book-2' });
		expect(deleteBookFts).toHaveBeenCalledWith('book-2');
	});
});
