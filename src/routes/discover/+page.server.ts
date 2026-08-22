import type { PageServerLoad } from './$types';
import { catalogStats, getFeaturedBook, listAuthors, listBooks, listCategories } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	const featured = getFeaturedBook();
	const books = listBooks().filter((item) => item.id !== featured?.id);

	return {
		featured,
		books,
		categories: listCategories(),
		authors: listAuthors(),
		stats: catalogStats()
	};
};
