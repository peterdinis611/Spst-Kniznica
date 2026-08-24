import { isActionFailure } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteAuthor, listDeskAuthors, saveAuthor } from '$lib/server/admin-desk';
import { actions, load } from '../+page.server';

vi.mock('$lib/server/admin-desk', () => ({
	listDeskAuthors: vi.fn(),
	getDeskAuthor: vi.fn(),
	saveAuthor: vi.fn(),
	deleteAuthor: vi.fn()
}));

const row = {
	id: 'auth-belko',
	name: 'Prof. Ján Belko',
	slug: 'jan-belko',
	bio: 'Informatik.',
	lifespan: '1952 —',
	role: 'informatik',
	bookCount: 4
};

function event(fields: Record<string, string>) {
	return {
		request: {
			formData: async () => {
				const body = new FormData();
				for (const [key, value] of Object.entries(fields)) body.set(key, value);
				return body;
			}
		}
	} as unknown as Parameters<NonNullable<typeof actions.save>>[0];
}

describe('admin autori', () => {
	beforeEach(() => {
		vi.mocked(listDeskAuthors).mockReturnValue([row]);
		vi.mocked(saveAuthor).mockReset();
		vi.mocked(deleteAuthor).mockReset();
	});

	it('loads the edited medallion', async () => {
		const data = (await load({
			url: new URL('http://localhost/admin/autori?edit=auth-belko')
		} as Parameters<typeof load>[0])) as { current: typeof row | null };
		expect(data.current?.slug).toBe('jan-belko');
	});

	it('stamps a saved author', async () => {
		vi.mocked(saveAuthor).mockReturnValue({ ok: true });
		expect(
			await actions.save?.(
				event({
					name: 'Prof. Ján Belko',
					bio: 'Informatik.',
					lifespan: '1952 —',
					role: 'informatik'
				})
			)
		).toEqual({ stamp: 'Uložené' });
	});

	it('returns a missing author as a failure', async () => {
		vi.mocked(deleteAuthor).mockReturnValue({ ok: false, message: 'Autor sa nenašiel.' });
		const result = await actions.delete?.(event({ id: 'missing' }));
		expect(isActionFailure(result)).toBe(true);
	});
});
