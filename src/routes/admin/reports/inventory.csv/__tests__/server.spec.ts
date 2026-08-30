import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inventoryCsv, listInventoryRows } from '$lib/server/desk/reports';
import { GET } from '../+server';

vi.mock('$lib/server/desk/reports', () => ({
	listInventoryRows: vi.fn(),
	inventoryCsv: vi.fn()
}));

describe('inventory csv', () => {
	beforeEach(() => {
		vi.mocked(listInventoryRows).mockReset();
		vi.mocked(inventoryCsv).mockReset();
	});

	it('attaches a utf-8 sheet', async () => {
		vi.mocked(listInventoryRows).mockResolvedValue([]);
		vi.mocked(inventoryCsv).mockReturnValue('\uFEFFinventár\r\n');

		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = await response.text();

		expect(response.headers.get('content-type')).toMatch(/text\/csv/);
		expect(response.headers.get('content-disposition')).toMatch(/inventura-/);
		expect(body).toContain('inventár');
		expect(listInventoryRows).toHaveBeenCalledOnce();
	});
});
