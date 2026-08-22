import type { PageServerLoad } from './$types';
import { listAuthors } from '$lib/server/library';

export const load: PageServerLoad = async ({ url }) => {
	return {
		authors: listAuthors(),
		q: url.searchParams.get('q') ?? ''
	};
};
