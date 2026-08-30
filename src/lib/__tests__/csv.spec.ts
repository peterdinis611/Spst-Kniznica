import { describe, expect, it } from 'vitest';
import { csvCell, csvFileStamp, csvResponse, toCsv } from '../csv';

describe('toCsv', () => {
	it('writes a BOM and quotes hostile cells', () => {
		const body = toCsv(
			['názov', 'poznámka'],
			[
				['Algoritmy', 'ok'],
				['Stroje, dielňa', 'riadok\n"x"']
			]
		);

		expect(body.startsWith('\uFEFF')).toBe(true);
		expect(body).toContain('názov,poznámka');
		expect(body).toContain('"Stroje, dielňa"');
		expect(body).toContain('"riadok\n""x"""');
	});

	it('leaves a plain cell alone', () => {
		expect(csvCell('II.A')).toBe('II.A');
		expect(csvCell(21)).toBe('21');
	});
});

describe('csvResponse', () => {
	it('stamps an attachment header', async () => {
		const response = csvResponse('inventura-2026-08-30.csv', 'a,b\n');
		expect(response.headers.get('content-type')).toMatch(/text\/csv/);
		expect(response.headers.get('content-disposition')).toBe(
			'attachment; filename="inventura-2026-08-30.csv"'
		);
		expect(csvFileStamp(new Date(2026, 7, 30))).toBe('2026-08-30');
		await expect(response.text()).resolves.toBe('a,b\n');
	});
});
