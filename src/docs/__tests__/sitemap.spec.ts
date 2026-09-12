import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

describe('public map', () => {
	it('lists handbook chapters including e-mail', () => {
		const urls = sitemap().map((row) => row.url);
		expect(urls.some((url) => url.endsWith('/docs/email'))).toBe(true);
		expect(urls.some((url) => url.endsWith('/docs/objednavky'))).toBe(true);
		expect(urls.some((url) => url.endsWith('/docs/prevadzka'))).toBe(true);
	});

	it('keeps the desk out of robots', () => {
		const rules = robots().rules;
		const disallow = Array.isArray(rules) ? rules[0]?.disallow : rules.disallow;
		expect(disallow).toEqual(expect.arrayContaining(['/admin']));
	});
});
