import type { LayoutServerLoad } from './$types';
import { canOperateDesk, requireAdmin } from '$lib/server/admin-access';

export const load: LayoutServerLoad = async ({ locals }) => {
	const reader = requireAdmin(locals.user);
	return {
		desk: {
			id: reader.id,
			name: reader.name,
			email: reader.email,
			role: reader.role,
			manage: canOperateDesk(reader)
		}
	};
};
