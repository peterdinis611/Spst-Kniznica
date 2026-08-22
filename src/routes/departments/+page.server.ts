import type { PageServerLoad } from './$types';
import { listBooks, listCategories } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	const books = listBooks().filter((book) => book.id !== 'book-modlitbicky');
	const categories = listCategories().map((category) => ({
		...category,
		books: books.filter((book) => book.category.slug === category.slug).slice(0, 4)
	}));

	return { categories };
};
