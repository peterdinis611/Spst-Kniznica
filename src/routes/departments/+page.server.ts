import type { PageServerLoad } from './$types';
import { listBookSlips, listCategories } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	const [slips, catalog] = await Promise.all([listBookSlips(), listCategories()]);
	const books = slips.filter((book) => book.id !== 'book-modlitbicky');
	const categories = catalog.map((category) => ({
		...category,
		books: books.filter((book) => book.category.slug === category.slug).slice(0, 4)
	}));

	return { categories };
};
