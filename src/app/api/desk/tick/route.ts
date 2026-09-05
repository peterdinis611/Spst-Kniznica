import { env } from '@/config/env';
import { eventFromRequest, isRateLimited } from '@/server/rate-limit';
import { deskTickAllowed, tickSecretFrom } from '@/server/tick-gate';
import { runDeskTick } from '@/server/desk-tick';

export async function GET(request: Request) {
	if (await isRateLimited(eventFromRequest(request), 'tick')) {
		return Response.json({ message: 'Príliš veľa pokusov. Počkaj chvíľu.' }, { status: 429 });
	}
	if (!deskTickAllowed(env.DESK_TICK_SECRET, tickSecretFrom(request))) {
		return Response.json({ message: 'Tik pultu je zamknutý.' }, { status: 403 });
	}

	const report = await runDeskTick();
	return Response.json(report);
}
