import { isActionFailure } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authorOptions, bookOptions, deleteLink, listDeskLinks, saveLink } from '$lib/server/admin-desk';
import { actions, load } from '../+page.server';

vi.mock('$lib/server/admin-desk', () => ({
	listDeskLinks: vi.fn(),
	bookOptions: vi.fn(),
	authorOptions: vi.fn(),
	saveLink: vi.fn(),
	deleteLink: vi.fn()
}));

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

describe('admin vazby', () => {
	beforeEach(() => {
		vi.mocked(listDeskLinks).mockResolvedValue([]);
		vi.mocked(bookOptions).mockResolvedValue([]);
		vi.mocked(authorOptions).mockResolvedValue([]);
		vi.mocked(saveLink).mockReset();
		vi.mocked(deleteLink).mockReset();
	});

	it('searches links', async () => {
		await load({
			url: new URL('http://localhost/admin/book-authors?q=belko')
		} as Parameters<typeof load>[0]);
		expect(listDeskLinks).toHaveBeenCalledWith('belko');
	});

	it('saves a book–author link', async () => {
		vi.mocked(saveLink).mockResolvedValue({ ok: true });
		expect(
			await actions.save?.(event({ bookId: 'book-1', authorId: 'auth-1', position: '2' }))
		).toEqual({ stamp: 'Uložené' });
		expect(saveLink).toHaveBeenCalledWith({ bookId: 'book-1', authorId: 'auth-1', position: 2 });
	});

	it('returns a missing link as a failure', async () => {
		vi.mocked(deleteLink).mockResolvedValue({ ok: false, message: 'Väzba sa nenašla.' });
		const result = await actions.delete?.(event({ bookId: 'book-1', authorId: 'auth-1' }));
		expect(isActionFailure(result)).toBe(true);
	});
});
