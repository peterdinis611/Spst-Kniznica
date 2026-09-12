import { describe, expect, it } from 'vitest';
import { docsSource, getDocPage, listDocChapters } from '../source';

describe('docsSource', () => {
	it('loads handbook chapters from content/docs', () => {
		const pages = docsSource.getPages();
		const urls = pages.map((page) => page.url);

		expect(urls[0]).toBe('/docs');
		expect(urls).toContain('/docs/katalog');
		expect(urls).toContain('/docs/objednavky');
		expect(urls).toContain('/docs/tempo');
		expect(urls).toContain('/docs/prevadzka');
		expect(urls.indexOf('/docs/vypozicky')).toBeLessThan(urls.indexOf('/docs/objednavky'));
		expect(getDocPage([])?.data.title).toBe('Príručka fondu');
		expect(getDocPage(['email'])?.data.title).toBe('E-mail');
		expect(docsSource.getPage(['nie'])).toBeUndefined();
		expect(listDocChapters().every((page) => page.body.length > 40)).toBe(true);
	});
});
