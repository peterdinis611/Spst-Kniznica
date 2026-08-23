import type { PageServerLoad } from './$types';
import { listBookSlips, listCategories } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	const books = listBookSlips().filter((book) => book.id !== 'book-modlitbicky');
	const categories = listCategories().map((category) => ({
		...category,
		books: books.filter((book) => book.category.slug === category.slug).slice(0, 4)
	}));

	return { categories };
};
