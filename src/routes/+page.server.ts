import type { PageServerLoad } from './$types';
import { catalogStats, getFeaturedBook, listAuthors, listBooks } from '$lib/server/library';
import { authorLine } from '$lib/format';

export const load: PageServerLoad = async () => {
	const books = listBooks();
	const authors = [...listAuthors()].sort((a, b) => b.bookCount - a.bookCount);

	return {
		featured: getFeaturedBook(),
		books: books.slice(0, 10),
		authors: authors.slice(0, 5),
		stats: catalogStats(),
		searchIndex: books.map((book) => ({
			id: book.id,
			title: book.title,
			authors: authorLine(book.authors),
			callNumber: book.callNumber,
			category: book.category.name,
			isbn: book.isbn,
			copiesAvailable: book.copiesAvailable
		}))
	};
};
