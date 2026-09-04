import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db', () => ({ db: {} }));

import { inventoryCsv, inventoryXml, overdueCsv, overdueXml } from '../reports';

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
				categoryCode: 'INF',
				sight: 'out',
				lastSeenAt: null
			}
		]);

		expect(body).toContain('inventár,stav,nález,signatúra');
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

describe('report xml', () => {
	it('prints a holding as a catalog card', () => {
		const body = inventoryXml(
			[
				{
					inventoryNo: 'INF-001',
					status: 'loaned',
					title: 'Algoritmy v dielni',
					callNumber: 'INF 004.4 ALG',
					isbn: '97880',
					year: 2020,
					categoryName: 'Informatika',
					categoryCode: 'INF',
					sight: 'out',
					lastSeenAt: null
				}
			],
			'30. 08. 2026'
		);

		expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
		expect(body).toContain('xmlns="urn:spst:kniznica:vykaz"');
		expect(body).toContain('druh="inventura"');
		expect(body).toContain('<inventar>INF-001</inventar>');
		expect(body).toContain('<stav>vonku</stav>');
		expect(body).toContain('<nalez>vonku</nalez>');
		expect(body).toContain('<nazov>Algoritmy v dielni</nazov>');
		expect(body).toContain('kod="INF"');
		expect(body).toContain('\t<vytlacok>');
	});

	it('prints an overdue slip and escapes markup', () => {
		const body = overdueXml(
			[
				{
					id: 'loan-1',
					klass: 'II.A',
					firstName: 'Peter',
					lastName: 'Dinis & syn',
					title: 'Stroje <dielňa>',
					callNumber: 'STR 12',
					dueAt: new Date(2026, 7, 1),
					lateDays: 12
				}
			],
			'30. 08. 2026'
		);

		expect(body).toContain('druh="po-lehote"');
		expect(body).toContain('<trieda>II.A</trieda>');
		expect(body).toContain('<priezvisko>Dinis &amp; syn</priezvisko>');
		expect(body).toContain('<zvazok>Stroje &lt;dielňa&gt;</zvazok>');
		expect(body).toContain('<dniPoLehote>12</dniPoLehote>');
	});
});
