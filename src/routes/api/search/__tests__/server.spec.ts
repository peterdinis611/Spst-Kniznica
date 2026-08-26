import { describe, expect, it, vi } from 'vitest';
import { searchCatalog } from '$lib/server/library';
import { GET } from '../+server';

vi.mock('$lib/server/library', () => ({
	searchCatalog: vi.fn()
}));

describe('catalog search api', () => {
	it('returns an empty tray for a blank query', async () => {
		const response = await GET({
			url: new URL('http://localhost/api/search?q=%20')
		} as Parameters<typeof GET>[0]);
		const body = await response.json();

		expect(body).toEqual({ items: [] });
		expect(searchCatalog).not.toHaveBeenCalled();
	});

	it('asks the catalog for a short list', async () => {
		vi.mocked(searchCatalog).mockResolvedValue([
			{
				id: 'stroje-1',
				title: 'Stroje',
				authors: 'Ján Test',
				callNumber: 'STR 12',
				category: 'Strojárstvo',
				isbn: '',
				copiesAvailable: 1,
				coverUrl: null
			}
		]);

		const response = await GET({
			url: new URL('http://localhost/api/search?q=stroje')
		} as Parameters<typeof GET>[0]);
		const body = await response.json();

		expect(searchCatalog).toHaveBeenCalledWith('stroje', 8);
		expect(body.items).toHaveLength(1);
		expect(body.items[0].title).toBe('Stroje');
	});
});
