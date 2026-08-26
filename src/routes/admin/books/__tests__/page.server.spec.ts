import { isActionFailure } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	authorOptions,
	bookAuthorIds,
	categoryOptions,
	deleteBook,
	listDeskBooks,
	saveBook
} from '$lib/server/admin-desk';
import { actions, load } from '../+page.server';

vi.mock('$lib/server/admin-desk', () => ({
	listDeskBooks: vi.fn(),
	getDeskBook: vi.fn(),
	bookAuthorIds: vi.fn(),
	categoryOptions: vi.fn(),
	authorOptions: vi.fn(),
	saveBook: vi.fn(),
	deleteBook: vi.fn()
}));

const row = {
	id: 'book-algo',
	title: 'Algoritmy',
	subtitle: null,
	year: 2020,
	pages: 240,
	isbn: '97880',
	description: 'Učebnica.',
	callNumber: 'INF 004',
	categoryId: 'cat-inf',
	categoryName: 'Informatika',
	copiesTotal: 3,
	copiesAvailable: 2,
	publisher: 'SPŠT',
	language: 'sk',
	featured: false,
	coverUrl: null,
	coverKey: null
};

function event(fields: Record<string, string | string[]>) {
	return {
		request: {
			formData: async () => {
				const body = new FormData();
				for (const [key, value] of Object.entries(fields)) {
					if (Array.isArray(value)) value.forEach((item) => body.append(key, item));
					else body.set(key, value);
				}
				return body;
			}
		}
	} as unknown as Parameters<NonNullable<typeof actions.save>>[0];
}

describe('admin knihy load', () => {
	beforeEach(() => {
		vi.mocked(listDeskBooks).mockResolvedValue([row]);
		vi.mocked(bookAuthorIds).mockResolvedValue([{ authorId: 'auth-belko', position: 0 }]);
		vi.mocked(categoryOptions).mockResolvedValue([]);
		vi.mocked(authorOptions).mockResolvedValue([]);
	});

	it('attaches linked authors when editing a volume', async () => {
		const data = (await load({
			url: new URL('http://localhost/admin/books?edit=book-algo&q=algo')
		} as Parameters<typeof load>[0])) as { linkedIds: string[]; current: typeof row | null };

		expect(listDeskBooks).toHaveBeenCalledWith('algo');
		expect(data.current?.id).toBe('book-algo');
		expect(data.linkedIds).toEqual(['auth-belko']);
	});
});

describe('admin knihy actions', () => {
	beforeEach(() => {
		vi.mocked(saveBook).mockReset();
		vi.mocked(deleteBook).mockReset();
	});

	it('passes featured and author ids into the desk', async () => {
		vi.mocked(saveBook).mockResolvedValue({ ok: true });

		const result = await actions.save?.(
			event({
				title: 'Algoritmy',
				isbn: '97880',
				callNumber: 'INF 004',
				description: 'Učebnica.',
				categoryId: 'cat-inf',
				publisher: 'SPŠT',
				year: '2020',
				pages: '240',
				featured: '1',
				authorIds: ['auth-belko', 'auth-kovac'],
				coverUrl: 'https://ufs.sh/f/jacket',
				coverKey: 'jacket'
			})
		);

		expect(saveBook).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Algoritmy',
				featured: true,
				authorIds: ['auth-belko', 'auth-kovac'],
				year: 2020,
				coverUrl: 'https://ufs.sh/f/jacket',
				coverKey: 'jacket'
			})
		);
		expect(result).toEqual({ stamp: 'Uložené' });
	});

	it('returns a blocked delete', async () => {
		vi.mocked(deleteBook).mockResolvedValue({
			ok: false,
			message: 'Kniha má aktívne výpožičky. Najprv ich vráť.'
		});

		const result = await actions.delete?.(event({ id: 'book-algo' }));

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.data).toEqual({
				message: 'Kniha má aktívne výpožičky. Najprv ich vráť.'
			});
		}
	});
});
