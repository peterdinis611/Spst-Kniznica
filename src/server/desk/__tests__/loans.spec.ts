import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db', () => ({ db: {} }));

import { parseDeskLoanFilter } from '../loans';

describe('parseDeskLoanFilter', () => {
	it('normalizes a class and the open flag', () => {
		const url = new URL('http://localhost/admin/loans?class=ii.a&open=1&q=stroje');
		expect(parseDeskLoanFilter(url)).toEqual({
			q: 'stroje',
			klass: 'II.A',
			open: true
		});
	});

	it('keeps the drawer unfiltered on a blank slip', () => {
		expect(parseDeskLoanFilter(new URL('http://localhost/admin/loans'))).toEqual({
			q: '',
			klass: '',
			open: false
		});
	});
});
