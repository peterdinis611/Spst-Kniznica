import { describe, expect, it } from 'vitest';
import { holdMailCopy } from '../hold-mail';

const slip = {
	to: 'peter@spst.sk',
	readerName: 'Peter Dinis',
	bookTitle: 'Algoritmy v dielni',
	callNumber: 'INF 004.4 ALG',
	place: 2,
	expiresAt: new Date(2026, 8, 6)
};

describe('holdMailCopy', () => {
	it('stamps a queue ticket with the place in line', () => {
		const copy = holdMailCopy({ kind: 'queued', ...slip });
		expect(copy.subject).toBe('Čakací lístok · Algoritmy v dielni · SPŠT knižnica');
		expect(copy.text).toContain('2. v rade');
		expect(copy.text).toContain('/loans');
		expect(copy.html).toContain('Čakáš.');
		expect(copy.html).not.toContain('<script>');
	});

	it('stamps a ready hold with the pickup window', () => {
		const copy = holdMailCopy({ kind: 'ready', ...slip });
		expect(copy.subject).toBe('Na pulte · Algoritmy v dielni · SPŠT knižnica');
		expect(copy.text).toContain('pripravený na pulte');
		expect(copy.html).toContain('Pripravené.');
	});

	it('warns the day before a hold lapses', () => {
		const copy = holdMailCopy({ kind: 'expireSoon', ...slip });
		expect(copy.subject).toBe('Zajtra vyprší lístok · Algoritmy v dielni · SPŠT knižnica');
		expect(copy.text).toContain('vyprší zajtra');
		expect(copy.html).toContain('Zajtra vyprší.');
	});

	it('tells the waiter the slip lapsed', () => {
		const copy = holdMailCopy({ kind: 'expired', ...slip });
		expect(copy.subject).toBe('Lístok vypršal · Algoritmy v dielni · SPŠT knižnica');
		expect(copy.text).toContain('vypršal');
		expect(copy.html).toContain('Vypršalo.');
	});

	it('tells the waiter the desk cancelled the queue', () => {
		const copy = holdMailCopy({ kind: 'cancelled', ...slip });
		expect(copy.subject).toBe('Rad zrušený · Algoritmy v dielni · SPŠT knižnica');
		expect(copy.text).toContain('pult zrušil');
		expect(copy.html).toContain('Zrušené.');
	});

	it('escapes a hostile title in HTML', () => {
		const copy = holdMailCopy({
			kind: 'queued',
			...slip,
			bookTitle: '<img src=x onerror=alert(1)>'
		});
		expect(copy.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
		expect(copy.html).not.toContain('<img src=x');
	});
});
