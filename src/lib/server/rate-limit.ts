import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { RateLimiter } from 'sveltekit-rate-limiter/server';

export const RATE_LIMIT_MESSAGE = 'Príliš veľa pokusov. Počkaj chvíľu a skús to znova.';

export type RateLimitKind = 'auth' | 'mail';

const authLimiter = new RateLimiter({
	IP: [200, 'h'],
	IPUA: [8, 'm']
});

const mailLimiter = new RateLimiter({
	IP: [60, 'h'],
	IPUA: [4, 'h']
});

function rateLimitOff() {
	const flag = env.RATE_LIMIT?.trim().toLowerCase();
	return flag === 'off' || flag === '0' || flag === 'false';
}

export async function isRateLimited(event: RequestEvent, kind: RateLimitKind) {
	if (rateLimitOff()) return false;
	if (typeof event.getClientAddress !== 'function') return false;
	const limiter = kind === 'mail' ? mailLimiter : authLimiter;
	return limiter.isLimited(event);
}

export async function failIfRateLimited(
	event: RequestEvent,
	kind: RateLimitKind,
	extra: Record<string, unknown> = {}
): Promise<ActionFailure<{ message: string }> | null> {
	if (!(await isRateLimited(event, kind))) return null;
	return fail(429, { message: RATE_LIMIT_MESSAGE, ...extra });
}
