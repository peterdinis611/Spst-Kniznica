import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({ db: {} }));

import { inventoryCsv, overdueCsv } from '../reports';

describe('report csv', () => {
	it('prints a holding row with a Slovak status', () => {
		const body = inventoryCsv([
			{
				inventoryNo: 'INF-001',
				status: 'loaned',
				title: 'Algoritmy v dielni',
				callNumber: 'INF 004.4 ALG',
				isbn: '97880',
				year: 2020,
				categoryName: 'Informatika',
				categoryCode: 'INF'
			}
		]);

		expect(body).toContain('inventár,stav,signatúra');
		expect(body).toContain('INF-001');
		expect(body).toContain('vonku');
		expect(body).toContain('Algoritmy v dielni');
	});

	it('prints an overdue slip', () => {
		const body = overdueCsv([
			{
				id: 'loan-1',
				klass: 'II.A',
				firstName: 'Peter',
				lastName: 'Dinis',
				title: 'Stroje',
				callNumber: 'STR 12',
				dueAt: new Date(2026, 7, 1),
				lateDays: 12
			}
		]);

		expect(body).toContain('trieda,meno,priezvisko');
		expect(body).toContain('II.A');
		expect(body).toContain('Peter');
		expect(body).toContain('12');
	});
});
