import type { LayoutServerLoad } from './$types';
import { listCategoryChips } from '$lib/server/library';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = locals.user
		? { id: locals.user.id, name: locals.user.name, email: locals.user.email }
		: null;

	if (
		url.pathname === '/' ||
		url.pathname.startsWith('/docs') ||
		url.pathname.startsWith('/login')
	) {
		return { user, categories: [] };
	}

	return {
		user,
		categories: listCategoryChips()
	};
};
