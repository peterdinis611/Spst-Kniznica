import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAuthor, listBooksByAuthor } from '$lib/server/library';

export const load: PageServerLoad = async ({ params }) => {
	const person = getAuthor(params.slug);
	if (!person) error(404, 'Autor v registri nie je.');

	return {
		author: person,
		books: listBooksByAuthor(params.slug)
	};
};
