import type { PageServerLoad } from './$types';
import { catalogStats, getFeaturedBook, listAuthors, listBooks, listCategories } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	const featured = getFeaturedBook();

	const catalog = listBooks().filter((item) => item.id !== featured?.id);
	const authors = [...listAuthors()].sort((a, b) => b.bookCount - a.bookCount);

	return {
		featured,
		books: catalog.slice(0, 16),
		categories: listCategories(),
		authors: authors.slice(0, 12),
		stats: catalogStats()
	};
};
