import { describe, expect, it, vi } from 'vitest';
import { deskCounts } from '$lib/server/desk/counts';
import { pageOf } from '$lib/page-of';
import { load } from '../+page.server';

vi.mock('$lib/server/desk/counts', () => ({
	deskCounts: vi.fn()
}));

describe('admin overview', () => {
	it('puts drawer counts on the first card', async () => {
		vi.mocked(deskCounts).mockResolvedValue({
			categories: 8,
			authors: 12,
			books: 20,
			links: 20,
			holdings: 60,
			loans: 4,
			openLoans: 2,
			reservations: 0,
			readers: 3
		});

		const data = pageOf(await load({} as Parameters<typeof load>[0]));

		expect(data.counts.openLoans).toBe(2);
		expect(data.counts.books).toBe(20);
	});
});
