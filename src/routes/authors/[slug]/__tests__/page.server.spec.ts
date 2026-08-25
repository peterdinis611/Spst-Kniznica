import { isHttpError } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { getAuthor, listBookSlipsByAuthor } from '$lib/server/library';
import { load } from '../+page.server';

vi.mock('$lib/server/library', () => ({
	getAuthor: vi.fn(),
	listBookSlipsByAuthor: vi.fn()
}));

describe('author card load', () => {
	it('404s a missing author', async () => {
		vi.mocked(getAuthor).mockReturnValue(undefined);

		try {
			await load({ params: { slug: 'nie' } } as Parameters<typeof load>[0]);
			throw new Error('expected 404');
		} catch (error) {
			expect(isHttpError(error)).toBe(true);
			if (isHttpError(error)) expect(error.status).toBe(404);
		}
	});

	it('returns the person and their books', async () => {
		const author = {
			id: 'a1',
			name: 'Ján Test',
			slug: 'jan-test',
			bio: 'Učiteľ.',
			lifespan: '',
			role: 'autor',
			bookCount: 1
		};
		vi.mocked(getAuthor).mockReturnValue(author);
		vi.mocked(listBookSlipsByAuthor).mockReturnValue([]);

		const data = await load({ params: { slug: 'jan-test' } } as Parameters<typeof load>[0]);

		expect(data.author).toEqual(author);
		expect(listBookSlipsByAuthor).toHaveBeenCalledWith('jan-test');
	});
});
