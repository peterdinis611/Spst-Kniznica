import { describe, expect, it, vi } from 'vitest';
import { docsSource } from '$lib/docs/source';
import { listAuthors, listBooks, listCategories } from '$lib/server/library';
import { GET } from '../+server';

vi.mock('$lib/docs/source', () => ({
	docsSource: {
		getPages: vi.fn()
	}
}));

vi.mock('$lib/server/library', () => ({
	listAuthors: vi.fn(),
	listBooks: vi.fn(),
	listCategories: vi.fn()
}));

describe('sitemap.xml', () => {
	it('lists the hall, docs, and catalog cards', async () => {
		vi.mocked(docsSource.getPages).mockReturnValue([{ url: '/docs/pult' }] as never);
		vi.mocked(listBooks).mockReturnValue([{ id: 'stroje-1' }] as never);
		vi.mocked(listCategories).mockReturnValue([{ slug: 'informatika' }] as never);
		vi.mocked(listAuthors).mockReturnValue([{ slug: 'jan-test' }] as never);

		const response = await GET({
			url: new URL('http://localhost:5173/sitemap.xml')
		} as Parameters<typeof GET>[0]);
		const body = await response.text();

		expect(response.headers.get('Content-Type')).toMatch(/application\/xml/);
		expect(body).toContain('http://localhost:5173/');
		expect(body).toContain('http://localhost:5173/discover');
		expect(body).toContain('http://localhost:5173/books/stroje-1');
		expect(body).toContain('http://localhost:5173/departments/informatika');
		expect(body).toContain('http://localhost:5173/authors/jan-test');
		expect(body).toContain('http://localhost:5173/docs/pult');
	});
});
