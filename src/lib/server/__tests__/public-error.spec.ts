import { describe, expect, it } from 'vitest';
import { publicErrorMessage } from '../public-error';

describe('publicErrorMessage', () => {
	it('hides missing catalog pages', () => {
		expect(publicErrorMessage(new Error('ENOENT: missing'), 404)).toBe(
			'Túto stránku sme v katalógu nenašli.'
		);
	});

	it('hides internal paths and server faults', () => {
		expect(publicErrorMessage(new Error('ENOENT: /Users/peter/app'), 500)).toBe(
			'Fond túto kartu teraz neotvorí.'
		);
		expect(publicErrorMessage('crash in node_modules/foo', 500)).toBe(
			'Fond túto kartu teraz neotvorí.'
		);
		expect(publicErrorMessage(new Error('plain failure'), 500)).toBe(
			'Fond túto kartu teraz neotvorí.'
		);
	});

	it('keeps a public client message', () => {
		expect(publicErrorMessage(new Error('Pult je len pre správu fondu.'), 403)).toBe(
			'Pult je len pre správu fondu.'
		);
	});

	it('holds a rate-limit stamp', () => {
		expect(publicErrorMessage(new Error('Too many requests'), 429)).toBe(
			'Príliš veľa pokusov. Počkaj chvíľu a skús to znova.'
		);
	});
});
