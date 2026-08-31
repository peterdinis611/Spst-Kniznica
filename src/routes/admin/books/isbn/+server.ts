import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { lookupIsbnCard } from '$lib/server/desk/isbn';

export const GET: RequestHandler = async ({ url }) => {
	const isbn = url.searchParams.get('isbn')?.trim() ?? '';
	const result = await lookupIsbnCard(isbn);
	if (!result.ok) return json({ ok: false, message: result.message }, { status: 404 });
	return json({ ok: true, card: result.card });
};
