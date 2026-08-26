import type { LayoutServerLoad } from './$types';
import { canOpenDesk } from '$lib/server/admin-access';
import { listCategoryChips } from '$lib/server/library';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = locals.user
		? {
				id: locals.user.id,
				name: locals.user.name,
				email: locals.user.email,
				role: locals.user.role
			}
		: null;
	const admin = canOpenDesk(user);

	if (
		url.pathname === '/' ||
		url.pathname.startsWith('/docs') ||
		url.pathname.startsWith('/login') ||
		url.pathname.startsWith('/auth')
	) {
		return { user, admin, categories: [] };
	}

	return {
		user,
		admin,
		categories: await listCategoryChips()
	};
};
