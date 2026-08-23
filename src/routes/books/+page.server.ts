import type { PageServerLoad } from './$types';
import { listBookSlips } from '$lib/server/library';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const odbor = url.searchParams.get('odbor') ?? '';
	let books = listBookSlips(q || undefined);

	if (odbor) {
		books = books.filter((item) => item.category.slug === odbor);
	}

	return { books, q, odbor };
};
