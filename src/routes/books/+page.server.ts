import type { PageServerLoad } from './$types';
import { listBooks, listCategories } from '$lib/server/library';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const odbor = url.searchParams.get('odbor') ?? '';
	let books = listBooks(q || undefined);

	if (odbor) {
		books = books.filter((item) => item.category.slug === odbor);
	}

	return {
		books,
		q,
		odbor,
		categories: listCategories()
	};
};
