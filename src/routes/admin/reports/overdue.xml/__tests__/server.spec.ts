import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listOverdueRows, overdueXml } from '$lib/server/desk/reports';
import { GET } from '../+server';

vi.mock('$lib/server/desk/reports', () => ({
	listOverdueRows: vi.fn(),
	overdueXml: vi.fn()
}));

describe('overdue xml', () => {
	beforeEach(() => {
		vi.mocked(listOverdueRows).mockReset();
		vi.mocked(overdueXml).mockReset();
	});

	it('attaches a utf-8 catalog', async () => {
		vi.mocked(listOverdueRows).mockResolvedValue([]);
		vi.mocked(overdueXml).mockReturnValue('<?xml version="1.0"?>\n<fond pocet="0"/>\n');

		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = await response.text();

		expect(response.headers.get('content-disposition')).toMatch(/po-lehote-.*\.xml/);
		expect(body).toContain('<fond');
		expect(listOverdueRows).toHaveBeenCalledOnce();
	});
});
