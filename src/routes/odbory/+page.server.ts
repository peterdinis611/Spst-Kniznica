import type { PageServerLoad } from './$types';
import { listCategories } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	return { categories: listCategories() };
};
