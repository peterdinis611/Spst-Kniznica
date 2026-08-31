import { describe, expect, it, vi } from 'vitest';
import { lookupIsbnCard } from '$lib/server/desk/isbn';
import { GET } from '../+server';

vi.mock('$lib/server/desk/isbn', () => ({
	lookupIsbnCard: vi.fn()
}));

describe('isbn lookup', () => {
	it('returns a card from Open Library', async () => {
		vi.mocked(lookupIsbnCard).mockResolvedValue({
			ok: true,
			card: {
				isbn: '9780140328721',
				title: 'The Adventures of Tom Sawyer',
				subtitle: '',
				year: 1988,
				pages: 192,
				publisher: 'Puffin',
				description: '',
				authors: ['Mark Twain']
			}
		});

		const response = await GET({
			url: new URL('http://localhost/admin/books/isbn?isbn=9780140328721')
		} as Parameters<typeof GET>[0]);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.ok).toBe(true);
		expect(body.card.title).toMatch(/Tom Sawyer/);
	});

	it('keeps a miss as a 404 slip', async () => {
		vi.mocked(lookupIsbnCard).mockResolvedValue({
			ok: false,
			message: 'Toto ISBN v Open Library nie je.'
		});
		const response = await GET({
			url: new URL('http://localhost/admin/books/isbn?isbn=0000000000')
		} as Parameters<typeof GET>[0]);
		expect(response.status).toBe(404);
	});
});
