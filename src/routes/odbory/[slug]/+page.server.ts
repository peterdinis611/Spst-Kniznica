import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCategory, listBooksByCategory } from '$lib/server/library';

export const load: PageServerLoad = async ({ params }) => {
	const current = getCategory(params.slug);
	if (!current) error(404, 'Odbor v registri nie je.');

	return {
		category: current,
		books: listBooksByCategory(params.slug)
	};
};
