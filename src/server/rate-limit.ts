import { fail, type ActionFailure, type RequestEvent } from '@/http/kit';
import { env } from '@/config/env';

export const RATE_LIMIT_MESSAGE = 'Príliš veľa pokusov. Počkaj chvíľu a skús to znova.';

export type RateLimitKind = 'auth' | 'mail';

type Window = { max: number; ms: number };

const AUTH_IP: Window = { max: 200, ms: 60 * 60 * 1000 };
const AUTH_UA: Window = { max: 8, ms: 60 * 1000 };
const MAIL_IP: Window = { max: 60, ms: 60 * 60 * 1000 };
const MAIL_UA: Window = { max: 4, ms: 60 * 60 * 1000 };

const buckets = new Map<string, number[]>();

function rateLimitOff() {
	const flag = env.RATE_LIMIT?.trim().toLowerCase();
	return flag === 'off' || flag === '0' || flag === 'false';
}

function hit(key: string, window: Window) {
	const now = Date.now();
	const times = (buckets.get(key) ?? []).filter((stamp) => now - stamp < window.ms);
	if (times.length >= window.max) {
		buckets.set(key, times);
		return true;
	}
	times.push(now);
	buckets.set(key, times);
	return false;
}

export async function isRateLimited(event: RequestEvent, kind: RateLimitKind) {
	if (rateLimitOff()) return false;
	if (typeof event.getClientAddress !== 'function') return false;
	const ip = event.getClientAddress();
	const ua = event.request.headers.get('user-agent') ?? '';
	if (kind === 'mail') {
		return hit(`mail:ip:${ip}`, MAIL_IP) || hit(`mail:ua:${ip}|${ua}`, MAIL_UA);
	}
	return hit(`auth:ip:${ip}`, AUTH_IP) || hit(`auth:ua:${ip}|${ua}`, AUTH_UA);
}

export async function failIfRateLimited(
	event: RequestEvent,
	kind: RateLimitKind,
	extra: Record<string, unknown> = {}
): Promise<ActionFailure<{ message: string }> | null> {
	if (!(await isRateLimited(event, kind))) return null;
	return fail(429, { message: RATE_LIMIT_MESSAGE, ...extra });
}
