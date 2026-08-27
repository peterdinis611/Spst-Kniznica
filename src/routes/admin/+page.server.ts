import type { PageServerLoad } from './$types';
import { deskCounts } from '$lib/server/desk/counts';

export const load: PageServerLoad = async () => {
	return { counts: await deskCounts() };
};
