import type { PageServerLoad } from './$types';
import { listBooks, listCategories } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	const books = listBooks();
	const categories = listCategories().map((category) => ({
		...category,
		cover: books.find((book) => book.category.slug === category.slug)
	}));

	return { categories };
};
