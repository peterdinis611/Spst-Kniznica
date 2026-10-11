import { building, dev } from '@/config/runtime';
import { env } from '@/config/env';

/** Public site URL without a trailing slash. Required outside next dev / build. */
export function siteOrigin() {
	const raw = (env.ORIGIN ?? '').trim().replace(/\/$/, '');
	if (raw) return raw;
	if (dev || building) return 'http://localhost:3000';
	throw new Error('ORIGIN chýba. Nastav verejnú adresu fondu (napr. https://kniznica.example.sk).');
}

export function originIsSet() {
	return Boolean((env.ORIGIN ?? '').trim());
}
