import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCategory, listBookSlipsByCategory } from '$lib/server/library';

export const load: PageServerLoad = async ({ params }) => {
	const current = await getCategory(params.slug);
	if (!current) error(404, 'Odbor v registri nie je.');

	return {
		category: current,
		books: await listBookSlipsByCategory(params.slug)
	};
};
