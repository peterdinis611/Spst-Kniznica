import { describe, expect, it, vi } from 'vitest';
import { pageOf } from '$lib/page-of';
import { listInventoryRows, listOverdueRows } from '$lib/server/desk/reports';
import { load } from '../+page.server';

vi.mock('$lib/server/desk/reports', () => ({
	listInventoryRows: vi.fn(),
	listOverdueRows: vi.fn()
}));

describe('admin reports load', () => {
	it('puts both semester sheets on the folio', async () => {
		vi.mocked(listInventoryRows).mockResolvedValue([
			{
				inventoryNo: 'INF-001',
				status: 'available',
				title: 'Algoritmy',
				callNumber: 'INF 1',
				isbn: '97880',
				year: 2020,
				categoryName: 'Informatika',
				categoryCode: 'INF'
			}
		]);
		vi.mocked(listOverdueRows).mockResolvedValue([]);

		const data = pageOf(await load({} as Parameters<typeof load>[0]));

		expect(data.inventory).toHaveLength(1);
		expect(data.overdue).toEqual([]);
		expect(data.stamp).toMatch(/2026/);
	});
});
