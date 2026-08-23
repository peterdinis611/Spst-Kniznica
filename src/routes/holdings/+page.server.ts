import type { PageServerLoad } from './$types';
import { listBooks, listCategories } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	return {
		books: listBooks().filter((book) => book.id !== 'book-modlitbicky'),
		categories: listCategories()
	};
};
