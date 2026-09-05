import { isActionFailure } from '@/http/kit';
import type { RequestEvent } from '@/http/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { env } = vi.hoisted(() => ({ env: { RATE_LIMIT: '' } }));

vi.mock('@/config/env', () => ({ env }));

import { failIfRateLimited, isRateLimited, RATE_LIMIT_MESSAGE } from '../rate-limit';

function event(ip: string, ua = 'SPST-test'): RequestEvent {
	return {
		getClientAddress: () => ip,
		request: new Request('http://localhost/login', {
			method: 'POST',
			headers: { 'user-agent': ua }
		})
	} as RequestEvent;
}

function freshIp() {
	return `203.0.113.${1 + Math.floor(Math.random() * 250)}`;
}

describe('rate limit', () => {
	afterEach(() => {
		env.RATE_LIMIT = '';
	});

	it('lets a slip without a client address through', async () => {
		expect(await isRateLimited({} as RequestEvent, 'auth')).toBe(false);
	});

	it('stays open when RATE_LIMIT is off', async () => {
		env.RATE_LIMIT = 'off';
		const ip = freshIp();
		for (let n = 0; n < 12; n += 1) {
			expect(await isRateLimited(event(ip), 'auth')).toBe(false);
		}
	});

	it('holds an auth stamp after eight tries from the same browser', async () => {
		const ip = freshIp();
		for (let n = 0; n < 8; n += 1) {
			expect(await isRateLimited(event(ip), 'auth')).toBe(false);
		}
		expect(await isRateLimited(event(ip), 'auth')).toBe(true);
	});

	it('holds a reader action after twenty tries from one preukaz', async () => {
		const ip = freshIp();
		const user = `act-${ip}`;
		for (let n = 0; n < 20; n += 1) {
			expect(await isRateLimited(event(ip), 'action', user)).toBe(false);
		}
		expect(await isRateLimited(event(ip), 'action', user)).toBe(true);
	});

	it('holds an order stamp after eight tries from one preukaz', async () => {
		const ip = freshIp();
		const user = `reader-${ip}`;
		for (let n = 0; n < 8; n += 1) {
			expect(await isRateLimited(event(ip), 'order', user)).toBe(false);
		}
		expect(await isRateLimited(event(ip), 'order', user)).toBe(true);
	});

	it('returns a 429 slip with the desk copy', async () => {
		const ip = freshIp();
		for (let n = 0; n < 8; n += 1) {
			expect(await failIfRateLimited(event(ip), 'auth')).toBeNull();
		}

		const blocked = await failIfRateLimited(event(ip), 'auth', { mode: 'vstup' });
		expect(isActionFailure(blocked)).toBe(true);
		if (!blocked) throw new Error('expected a 429 slip');
		expect(blocked.status).toBe(429);
		expect(blocked.data).toEqual({ message: RATE_LIMIT_MESSAGE, mode: 'vstup' });
	});
});
