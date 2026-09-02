import type { PageServerLoad } from './$types';
import {
	catalogStats,
	listAuthorSlips,
	listBookSlips,
	listCategoryChips,
	toSearchItem
} from '$lib/server/library';

export const load: PageServerLoad = async () => {
	const [slipsRaw, authorsRaw, stats, categories] = await Promise.all([
		listBookSlips(),
		listAuthorSlips(),
		catalogStats(),
		listCategoryChips()
	]);
	const slips = slipsRaw.filter((book) => book.id !== 'book-modlitbicky');
	const ready = slips.filter((book) => book.copiesAvailable > 0);
	const authors = [...authorsRaw].sort((a, b) => b.bookCount - a.bookCount);

	return {
		books: ready.slice(0, 16),
		ledger: ready.slice(16, 28),
		shelf: slips.slice(0, 81).map((book) => ({ id: book.id, title: book.title })),
		authors: authors.slice(0, 12).map((author) => ({
			id: author.id,
			name: author.name,
			slug: author.slug,
			bookCount: author.bookCount
		})),
		categories,
		stats,
		searchPreview: ready.slice(0, 10).map(toSearchItem)
	};
};
