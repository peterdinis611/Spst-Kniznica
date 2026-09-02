import type { PageServerLoad } from './$types';
import { catalogStats, getFeaturedBook, listAuthorSlips, listBookSlips } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	const [featured, slips, authorsRaw, stats] = await Promise.all([
		getFeaturedBook(),
		listBookSlips(),
		listAuthorSlips(),
		catalogStats()
	]);
	const catalog = slips.filter((item) => item.id !== featured?.id);
	const authors = [...authorsRaw].sort((a, b) => b.bookCount - a.bookCount);

	return {
		featured,
		books: catalog.filter((item) => item.copiesAvailable > 0).slice(0, 36),
		authors: authors.slice(0, 16).map((author) => ({
			id: author.id,
			name: author.name,
			slug: author.slug,
			bookCount: author.bookCount
		})),
		stats
	};
};
