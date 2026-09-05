import { createHash, timingSafeEqual } from 'node:crypto';

function stamp(value: string) {
	return createHash('sha256').update(value).digest();
}

export function deskTickAllowed(secret: string | undefined, given: string | undefined) {
	const expected = secret?.trim() ?? '';
	const got = given?.trim() ?? '';
	if (!expected || !got) return false;
	return timingSafeEqual(stamp(expected), stamp(got));
}

export function tickSecretFrom(request: Request) {
	const header = request.headers.get('authorization');
	if (!header || !/^Bearer /i.test(header)) return '';
	return header.slice(7).trim();
}
