import { describe, expect, it } from 'vitest';
import { GET } from '../+server';

describe('robots.txt', () => {
	it('hides the desk, loans, and login from crawlers', async () => {
		const response = await GET({
			url: new URL('http://localhost:5173/robots.txt')
		} as Parameters<typeof GET>[0]);
		const body = await response.text();

		expect(response.headers.get('Content-Type')).toMatch(/text\/plain/);
		expect(body).toContain('Disallow: /admin');
		expect(body).toContain('Disallow: /loans');
		expect(body).toContain('Sitemap: http://localhost:5173/sitemap.xml');
	});
});
