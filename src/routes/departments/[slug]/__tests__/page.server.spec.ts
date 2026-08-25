import { isHttpError } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { getCategory, listBookSlipsByCategory } from '$lib/server/library';
import { load } from '../+page.server';

vi.mock('$lib/server/library', () => ({
	getCategory: vi.fn(),
	listBookSlipsByCategory: vi.fn()
}));

describe('department card load', () => {
	it('404s a missing odbor', async () => {
		vi.mocked(getCategory).mockReturnValue(undefined);

		try {
			await load({ params: { slug: 'nie' } } as Parameters<typeof load>[0]);
			throw new Error('expected 404');
		} catch (error) {
			expect(isHttpError(error)).toBe(true);
			if (isHttpError(error)) expect(error.status).toBe(404);
		}
	});

	it('returns the odbor and its shelf', async () => {
		const category = {
			id: 'cat-str',
			name: 'Strojárstvo',
			slug: 'strojarstvo',
			description: 'Dielňa.',
			code: 'STR',
			accent: '#3d2a1c',
			bookCount: 1
		};
		vi.mocked(getCategory).mockReturnValue(category);
		vi.mocked(listBookSlipsByCategory).mockReturnValue([]);

		const data = await load({ params: { slug: 'strojarstvo' } } as Parameters<typeof load>[0]);

		expect(data.category).toEqual(category);
		expect(listBookSlipsByCategory).toHaveBeenCalledWith('strojarstvo');
	});
});
