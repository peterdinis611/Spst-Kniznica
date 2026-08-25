import { describe, expect, it } from 'vitest';
import { loanMailCopy } from '../loan-mail';

const slip = {
	to: 'peter@spst.sk',
	readerName: 'Peter Dinis',
	bookTitle: 'Algoritmy v dielni',
	callNumber: 'INF 004.4 ALG',
	dueAt: new Date(2026, 8, 13),
	className: 'II.A',
	days: 21
};

describe('loanMailCopy', () => {
	it('stamps a borrow slip with the due date', () => {
		const copy = loanMailCopy({ kind: 'borrow', ...slip });
		expect(copy.subject).toBe('Vypožičané · Algoritmy v dielni · SPŠT knižnica');
		expect(copy.text).toContain('Algoritmy v dielni');
		expect(copy.text).toContain('/loans');
		expect(copy.html).toContain('Vypožičané.');
		expect(copy.html).toContain('INF 004.4 ALG');
		expect(copy.html).not.toContain('<script>');
	});

	it('stamps a return slip into the catalog', () => {
		const copy = loanMailCopy({ kind: 'return', ...slip });
		expect(copy.subject).toBe('Vrátené · Algoritmy v dielni · SPŠT knižnica');
		expect(copy.text).toContain('/books');
		expect(copy.html).toContain('Vrátené.');
	});

	it('escapes a hostile title in HTML', () => {
		const copy = loanMailCopy({
			kind: 'borrow',
			...slip,
			bookTitle: '<img src=x onerror=alert(1)>'
		});
		expect(copy.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
		expect(copy.html).not.toContain('<img src=x');
	});
});
