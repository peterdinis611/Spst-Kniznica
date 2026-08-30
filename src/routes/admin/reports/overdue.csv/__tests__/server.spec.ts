import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listOverdueRows, overdueCsv } from '$lib/server/desk/reports';
import { GET } from '../+server';

vi.mock('$lib/server/desk/reports', () => ({
	listOverdueRows: vi.fn(),
	overdueCsv: vi.fn()
}));

describe('overdue csv', () => {
	beforeEach(() => {
		vi.mocked(listOverdueRows).mockReset();
		vi.mocked(overdueCsv).mockReset();
	});

	it('attaches a utf-8 sheet', async () => {
		vi.mocked(listOverdueRows).mockResolvedValue([]);
		vi.mocked(overdueCsv).mockReturnValue('\uFEFFtrieda\r\n');

		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = await response.text();

		expect(response.headers.get('content-disposition')).toMatch(/po-lehote-/);
		expect(body).toContain('trieda');
		expect(listOverdueRows).toHaveBeenCalledOnce();
	});
});
