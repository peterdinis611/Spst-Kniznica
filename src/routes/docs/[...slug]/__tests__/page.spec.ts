import { isHttpError } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { docsSource } from '$lib/docs/source';
import { load } from '../+page';

vi.mock('$lib/docs/source', () => ({
	docsSource: {
		getPage: vi.fn(),
		pageTree: { children: [] }
	}
}));

describe('docs page load', () => {
	it('404s a missing chapter', async () => {
		vi.mocked(docsSource.getPage).mockReturnValue(undefined);

		try {
			await load({ params: { slug: 'nie' } } as Parameters<typeof load>[0]);
			throw new Error('expected 404');
		} catch (error) {
			expect(isHttpError(error)).toBe(true);
			if (isHttpError(error)) expect(error.status).toBe(404);
		}
	});

	it('opens the handbook index without a slug', async () => {
		const page = { url: '/docs', data: { title: 'Príručka' } };
		vi.mocked(docsSource.getPage).mockReturnValue(page as never);

		const data = await load({ params: { slug: '' } } as Parameters<typeof load>[0]);

		expect(docsSource.getPage).toHaveBeenCalledWith([]);
		expect(data.page).toEqual(page);
		expect(data.pageTree).toEqual({ children: [] });
	});
});
