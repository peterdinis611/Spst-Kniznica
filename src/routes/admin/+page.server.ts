import type { PageServerLoad } from './$types';
import { deskCounts } from '$lib/server/admin-desk';

export const load: PageServerLoad = async () => {
	return { counts: deskCounts() };
};
