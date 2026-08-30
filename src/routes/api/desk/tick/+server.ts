import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { runDeskTick } from '$lib/server/desk-tick';
import type { RequestHandler } from './$types';

function allowed(request: Request) {
	const secret = env.DESK_TICK_SECRET?.trim();
	if (!secret) return false;
	const header = request.headers.get('authorization') ?? '';
	const bearer = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
	const query = new URL(request.url).searchParams.get('secret')?.trim() ?? '';
	return bearer === secret || query === secret;
}

export const GET: RequestHandler = async ({ request }) => {
	if (!allowed(request)) {
		return json({ ok: false, message: 'Pult tento tik neotvorí.' }, { status: 403 });
	}

	const report = await runDeskTick();
	return json({ ok: true, ...report });
};
