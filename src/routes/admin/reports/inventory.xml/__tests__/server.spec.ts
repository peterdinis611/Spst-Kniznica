import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inventoryXml, listInventoryRows } from '$lib/server/desk/reports';
import { GET } from '../+server';

vi.mock('$lib/server/desk/reports', () => ({
	listInventoryRows: vi.fn(),
	inventoryXml: vi.fn()
}));

describe('inventory xml', () => {
	beforeEach(() => {
		vi.mocked(listInventoryRows).mockReset();
		vi.mocked(inventoryXml).mockReset();
	});

	it('attaches a utf-8 catalog', async () => {
		vi.mocked(listInventoryRows).mockResolvedValue([]);
		vi.mocked(inventoryXml).mockReturnValue('<?xml version="1.0"?>\n<fond pocet="0"/>\n');

		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = await response.text();

		expect(response.headers.get('content-type')).toMatch(/application\/xml/);
		expect(response.headers.get('content-disposition')).toMatch(/inventura-.*\.xml/);
		expect(body).toContain('<fond');
		expect(listInventoryRows).toHaveBeenCalledOnce();
	});
});
