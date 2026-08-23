import type { PageServerLoad } from './$types';
import { catalogStats, listAuthorSlips, listBookSlips, toSearchItem } from '$lib/server/library';
import { authorLine } from '$lib/format';

export const load: PageServerLoad = async () => {
	const slips = listBookSlips().filter((book) => book.id !== 'book-modlitbicky');
	const ready = slips.filter((book) => book.copiesAvailable > 0);
	const picks = ready.slice(0, 6);
	const authors = [...listAuthorSlips()].sort((a, b) => b.bookCount - a.bookCount);

	return {
		books: picks.map((book) => ({
			id: book.id,
			title: book.title,
			authors: authorLine(book.authors),
			copiesAvailable: book.copiesAvailable,
			category: book.category.name
		})),
		shelf: slips.slice(0, 22).map((book) => ({ id: book.id, title: book.title })),
		authors: authors.slice(0, 5).map((author) => ({
			id: author.id,
			name: author.name,
			slug: author.slug,
			bookCount: author.bookCount
		})),
		stats: catalogStats(),
		searchPreview: ready.slice(0, 6).map(toSearchItem)
	};
};
