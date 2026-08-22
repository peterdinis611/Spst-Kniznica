import type { PageServerLoad } from './$types';
import { catalogStats, getFeaturedBook, listAuthors, listBooks } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	const books = listBooks();
	const authors = [...listAuthors()].sort((a, b) => b.bookCount - a.bookCount);

	return {
		featured: getFeaturedBook(),
		books: books.slice(0, 10),
		authors: authors.slice(0, 5),
		stats: catalogStats()
	};
};
