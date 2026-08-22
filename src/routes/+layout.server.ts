import type { LayoutServerLoad } from './$types';
import { listCategories } from '$lib/server/library';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user
			? { id: locals.user.id, name: locals.user.name, email: locals.user.email }
			: null,
		categories: listCategories()
	};
};
