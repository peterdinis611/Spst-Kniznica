import type { PageServerLoad } from './$types';
import { listBookSlips } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	return {
		books: listBookSlips().filter((book) => book.id !== 'book-modlitbicky')
	};
};
