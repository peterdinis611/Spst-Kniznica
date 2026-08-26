import { describe, expect, it, vi } from 'vitest';
import { listAuthorSlips } from '$lib/server/library';
import { pageOf } from '$lib/page-of';
import { load } from '../+page.server';

vi.mock('$lib/server/library', () => ({
	listAuthorSlips: vi.fn()
}));

describe('authors load', () => {
	it('exposes the query and the author slips', async () => {
		const authors = [
			{
				id: 'a1',
				name: 'Ján Test',
				slug: 'jan-test',
				lifespan: '',
				role: 'autor',
				bookCount: 2
			}
		];
		vi.mocked(listAuthorSlips).mockResolvedValue(authors);

		const data = pageOf(
			await load({
				url: new URL('http://localhost/authors?q=ján')
			} as Parameters<typeof load>[0])
		);

		expect(data.authors).toEqual(authors);
		expect(data.q).toBe('ján');
	});
});
