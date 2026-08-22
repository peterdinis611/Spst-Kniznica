import type { PageServerLoad } from './$types';
import { listAuthors } from '$lib/server/library';

export const load: PageServerLoad = async () => {
	return { authors: listAuthors() };
};
