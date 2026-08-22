import type { PageServerLoad } from './$types';
import { catalogStats, listAuthors, listBooks } from '$lib/server/library';
import { authorLine } from '$lib/format';

export const load: PageServerLoad = async () => {
	const books = listBooks();
	const authors = [...listAuthors()].sort((a, b) => b.bookCount - a.bookCount);

	return {
		books: books.map((book) => ({
			id: book.id,
			title: book.title,
			authors: authorLine(book.authors),
			copiesAvailable: book.copiesAvailable,
			category: book.category.name
		})),
		authors: authors.slice(0, 5).map((author) => ({
			id: author.id,
			name: author.name,
			slug: author.slug,
			bookCount: author.bookCount
		})),
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
