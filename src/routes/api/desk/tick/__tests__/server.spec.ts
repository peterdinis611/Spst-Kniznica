import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runDeskTick } from '$lib/server/desk-tick';
import { GET } from '../+server';

const env = vi.hoisted(() => ({ DESK_TICK_SECRET: 'tick-secret' }));

vi.mock('$env/dynamic/private', () => ({ env }));

vi.mock('$lib/server/desk-tick', () => ({
	runDeskTick: vi.fn()
}));

function event(url: string, headers: HeadersInit = {}) {
	return {
		request: new Request(url, { headers })
	} as Parameters<typeof GET>[0];
}

describe('desk tick api', () => {
	beforeEach(() => {
		env.DESK_TICK_SECRET = 'tick-secret';
		vi.mocked(runDeskTick).mockReset();
		vi.mocked(runDeskTick).mockResolvedValue({ dueSoon: 1, overdue: 0, holds: 0 });
	});

	it('refuses a tick without the desk secret', async () => {
		env.DESK_TICK_SECRET = '';

		const response = await GET(event('http://localhost/api/desk/tick'));
		const body = await response.json();

		expect(response.status).toBe(403);
		expect(body.ok).toBe(false);
		expect(runDeskTick).not.toHaveBeenCalled();
	});

	it('runs the tick with a bearer token', async () => {
		const response = await GET(
			event('http://localhost/api/desk/tick', { authorization: 'Bearer tick-secret' })
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({ ok: true, dueSoon: 1, overdue: 0, holds: 0 });
		expect(runDeskTick).toHaveBeenCalledOnce();
	});

	it('runs the tick with a query secret', async () => {
		const response = await GET(event('http://localhost/api/desk/tick?secret=tick-secret'));
		const body = await response.json();

		expect(body.ok).toBe(true);
		expect(runDeskTick).toHaveBeenCalledOnce();
	});
});
