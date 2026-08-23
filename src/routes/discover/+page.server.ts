import type { PageServerLoad } from './$types';
import { catalogStats, getFeaturedBook, listAuthorSlips, listBookSlips } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	const featured = getFeaturedBook();
	const catalog = listBookSlips().filter((item) => item.id !== featured?.id);
	const authors = [...listAuthorSlips()].sort((a, b) => b.bookCount - a.bookCount);

	return {
		featured,
		books: catalog.slice(0, 16),
		authors: authors.slice(0, 12).map((author) => ({
			id: author.id,
			name: author.name,
			slug: author.slug,
			bookCount: author.bookCount
		})),
		stats: catalogStats()
	};
};
