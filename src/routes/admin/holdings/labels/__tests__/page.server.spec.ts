import { describe, expect, it, vi } from 'vitest';
import { pageOf } from '$lib/page-of';
import { listSpineLabels } from '$lib/server/desk/holdings';
import { load } from '../+page.server';

vi.mock('$lib/server/desk/holdings', () => ({
	listSpineLabels: vi.fn()
}));

describe('spine labels', () => {
	it('prints the current drawer search', async () => {
		vi.mocked(listSpineLabels).mockResolvedValue([
			{
				id: 'h-1',
				inventoryNo: 'INF-ALGO-01',
				callNumber: 'INF 004.4 BEL',
				title: 'Algoritmy',
				isbn: '97880',
				categoryCode: 'INF'
			}
		]);

		const data = pageOf(
			await load({
				url: new URL('http://localhost/admin/holdings/labels?q=algo')
			} as Parameters<typeof load>[0])
		);

		expect(listSpineLabels).toHaveBeenCalledWith('algo');
		expect(data.rows[0].inventoryNo).toBe('INF-ALGO-01');
	});
});
