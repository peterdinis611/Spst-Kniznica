import type { PageServerLoad } from './$types';
import { listAuthorSlips } from '$lib/server/library';

export const load: PageServerLoad = async ({ url }) => {
	return {
		authors: await listAuthorSlips(),
		q: url.searchParams.get('q') ?? ''
	};
};
