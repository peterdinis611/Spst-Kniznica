import { env } from '@/config/env';
import { deskTickAllowed } from '@/server/tick-gate';
import { runDeskTick } from '@/server/desk-tick';

function tickSecretFrom(request: Request) {
	const header = request.headers.get('authorization');
	if (header && /^Bearer /i.test(header)) return header.slice(7).trim();
	return new URL(request.url).searchParams.get('secret')?.trim() ?? '';
}

export async function GET(request: Request) {
	if (!deskTickAllowed(env.DESK_TICK_SECRET, tickSecretFrom(request))) {
		return Response.json({ message: 'Tik pultu je zamknutý.' }, { status: 403 });
	}

	const report = await runDeskTick();
	return Response.json(report);
}
