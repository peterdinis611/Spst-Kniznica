import type { LayoutServerLoad } from './$types';
import { countActiveLoans, listCategories } from '$lib/server/library';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user
			? { id: locals.user.id, name: locals.user.name, email: locals.user.email }
			: null,
		categories: listCategories(),
		loanCount: locals.user ? countActiveLoans(locals.user.id) : 0
	};
};
