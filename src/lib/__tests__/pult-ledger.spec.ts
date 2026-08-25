import { describe, expect, it } from 'vitest';
import {
	isPultStack,
	isPultStamp,
	pickCurrent,
	pultCellOf,
	pultHref,
	pultSearchPath,
	rowIdOf
} from '../pult-ledger';

describe('pultHref', () => {
	it('keeps the current query when opening a card', () => {
		const url = new URL('http://localhost/admin/books?q=stroje');
		expect(pultHref(url, { edit: 'book-1' })).toBe('/admin/books?q=stroje&edit=book-1');
	});

	it('clears an empty search without dropping the rest of the slip', () => {
		const url = new URL('http://localhost/admin/books?q=stroje&edit=book-1');
		expect(pultSearchPath(url, '  ')).toBe('/admin/books?edit=book-1');
	});

	it('drops the edit flag when cancelling a card', () => {
		const url = new URL('http://localhost/admin/books?q=stroje&edit=book-1');
		expect(pultHref(url, { edit: null })).toBe('/admin/books?q=stroje');
	});
});

describe('pickCurrent', () => {
	it('keeps the open slip even when the drawer list moved on', () => {
		const held = { id: 'cat-inf', name: 'Informatika' };
		expect(pickCurrent([], 'cat-inf', () => held)?.name).toBe('Informatika');
		expect(pickCurrent([held], '', () => held)).toBeNull();
	});
});

describe('pult cells', () => {
	it('tells a stacked title from a desk stamp', () => {
		expect(isPultStack({ title: 'Stroje', hint: 'STR 12' })).toBe(true);
		expect(isPultStamp({ stamp: 'knihovník', desk: true })).toBe(true);
		expect(isPultStack({ stamp: 'knihovník' })).toBe(false);
		expect(rowIdOf({ id: 'cat-inf' }, 3)).toBe('cat-inf');
		expect(rowIdOf({}, 3)).toBe('3');
	});

	it('prefers the cell template over the accessor', () => {
		const stacked = pultCellOf({
			column: {
				columnDef: {
					cell: () => ({ title: 'Stroje', hint: 'STR 12' })
				}
			},
			getContext: () => ({}),
			getValue: () => 'Stroje'
		});
		expect(isPultStack(stacked)).toBe(true);
		expect(pultCellOf({
			column: { columnDef: {} },
			getContext: () => ({}),
			getValue: () => 'holý lístok'
		})).toBe('holý lístok');
	});
});
