import type { PageServerLoad } from './$types';
import { listSpineLabels } from '$lib/server/desk/holdings';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	return { q, rows: await listSpineLabels(q) };
};
