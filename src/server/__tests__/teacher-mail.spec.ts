import { describe, expect, it } from 'vitest';
import { classDigestCopy, shouldMailClassDigest } from '../teacher-mail';

const now = new Date('2026-08-31T10:00:00Z');
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

const digest = {
	to: 'eva@spst.sk',
	teacherName: 'Eva Učiteľ',
	className: 'II.A',
	open: 4,
	overdue: 2,
	rows: [
		{
			title: 'Algoritmy v dielni',
			reader: 'Peter Dinis',
			dueAt: new Date(2026, 8, 1),
			late: true
		},
		{
			title: 'Stroje',
			reader: 'Jana Kováč',
			dueAt: new Date(2026, 8, 20),
			late: false
		}
	]
};

describe('shouldMailClassDigest', () => {
	it('skips an empty class', () => {
		expect(
			shouldMailClassDigest({
				open: 0,
				overdue: 0,
				lastOverdue: 2,
				mailedAt: yesterday,
				now
			})
		).toBe(false);
	});

	it('mails the first week and then waits', () => {
		expect(
			shouldMailClassDigest({
				open: 4,
				overdue: 1,
				lastOverdue: 1,
				mailedAt: null,
				now
			})
		).toBe(true);
		expect(
			shouldMailClassDigest({
				open: 4,
				overdue: 1,
				lastOverdue: 1,
				mailedAt: yesterday,
				now
			})
		).toBe(false);
		expect(
			shouldMailClassDigest({
				open: 4,
				overdue: 1,
				lastOverdue: 1,
				mailedAt: weekAgo,
				now
			})
		).toBe(true);
	});

	it('mails when a new overdue slip appears', () => {
		expect(
			shouldMailClassDigest({
				open: 4,
				overdue: 2,
				lastOverdue: 1,
				mailedAt: yesterday,
				now
			})
		).toBe(true);
		expect(
			shouldMailClassDigest({
				open: 4,
				overdue: 1,
				lastOverdue: 2,
				mailedAt: yesterday,
				now
			})
		).toBe(false);
	});
});

describe('classDigestCopy', () => {
	it('names the class, the count, and the overdue slips', () => {
		const copy = classDigestCopy(digest);
		expect(copy.subject).toBe('II.A vonku · 4 lístky, 2 po lehote · SPŠT knižnica');
		expect(copy.text).toContain('Peter Dinis');
		expect(copy.text).toContain('/admin/loans?class=II.A');
		expect(copy.html).toContain('Po lehote v triede.');
		expect(copy.html).not.toContain('<script>');
	});

	it('escapes a hostile title in HTML', () => {
		const copy = classDigestCopy({
			...digest,
			rows: [
				{
					title: '<img src=x onerror=alert(1)>',
					reader: 'Peter Dinis',
					dueAt: new Date(2026, 8, 1),
					late: true
				}
			]
		});
		expect(copy.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
		expect(copy.html).not.toContain('<img src=x');
	});
});
