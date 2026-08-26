import { json } from '@sveltejs/kit';
import { searchCatalog } from '$lib/server/library';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (q.length < 1) return json({ items: [] });

	return json({ items: await searchCatalog(q, 8) });
};
