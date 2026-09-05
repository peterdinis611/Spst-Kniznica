import { fail, type ActionFailure, type RequestEvent } from '@/http/kit';
import { env } from '@/config/env';

export const RATE_LIMIT_MESSAGE = 'Príliš veľa pokusov. Počkaj chvíľu a skús to znova.';

export type RateLimitKind = 'auth' | 'mail' | 'order' | 'search' | 'tick' | 'action' | 'desk';

type Window = { max: number; ms: number };

const AUTH_IP: Window = { max: 200, ms: 60 * 60 * 1000 };
const AUTH_UA: Window = { max: 8, ms: 60 * 1000 };
const MAIL_IP: Window = { max: 60, ms: 60 * 60 * 1000 };
const MAIL_UA: Window = { max: 4, ms: 60 * 60 * 1000 };
const ORDER_IP: Window = { max: 20, ms: 10 * 60 * 1000 };
const ORDER_USER: Window = { max: 8, ms: 10 * 60 * 1000 };
const SEARCH_IP: Window = { max: 90, ms: 60 * 1000 };
const TICK_IP: Window = { max: 30, ms: 60 * 60 * 1000 };
const ACTION_IP: Window = { max: 40, ms: 10 * 60 * 1000 };
const ACTION_USER: Window = { max: 20, ms: 10 * 60 * 1000 };
const DESK_IP: Window = { max: 200, ms: 10 * 60 * 1000 };
const DESK_USER: Window = { max: 120, ms: 10 * 60 * 1000 };

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

export function eventFromRequest(request: Request): RequestEvent {
	const ip =
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip') ||
		request.headers.get('cf-connecting-ip') ||
		'0.0.0.0';
	return {
		getClientAddress: () => ip,
		request
	};
}

export async function isRateLimited(event: RequestEvent, kind: RateLimitKind, subject = '') {
	if (rateLimitOff()) return false;
	if (typeof event.getClientAddress !== 'function') return false;
	const ip = event.getClientAddress();
	const ua = event.request.headers.get('user-agent') ?? '';
	if (kind === 'mail') {
		return hit(`mail:ip:${ip}`, MAIL_IP) || hit(`mail:ua:${ip}|${ua}`, MAIL_UA);
	}
	if (kind === 'order') {
		return (
			hit(`order:ip:${ip}`, ORDER_IP) ||
			(subject ? hit(`order:user:${subject}`, ORDER_USER) : false)
		);
	}
	if (kind === 'search') return hit(`search:ip:${ip}`, SEARCH_IP);
	if (kind === 'tick') return hit(`tick:ip:${ip}`, TICK_IP);
	if (kind === 'action') {
		return (
			hit(`action:ip:${ip}`, ACTION_IP) ||
			(subject ? hit(`action:user:${subject}`, ACTION_USER) : false)
		);
	}
	if (kind === 'desk') {
		return (
			hit(`desk:ip:${ip}`, DESK_IP) || (subject ? hit(`desk:user:${subject}`, DESK_USER) : false)
		);
	}
	return hit(`auth:ip:${ip}`, AUTH_IP) || hit(`auth:ua:${ip}|${ua}`, AUTH_UA);
}

export async function failIfRateLimited(
	event: RequestEvent,
	kind: RateLimitKind,
	extra: Record<string, unknown> = {},
	subject = ''
): Promise<ActionFailure<{ message: string }> | null> {
	if (!(await isRateLimited(event, kind, subject))) return null;
	return fail(429, { message: RATE_LIMIT_MESSAGE, ...extra });
}
