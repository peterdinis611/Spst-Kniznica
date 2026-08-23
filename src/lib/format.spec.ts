import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authorLine, dueStatus, readerNumber, stampDate } from './format';

describe('readerNumber', () => {
	it('takes the last four alphanumerics and pads them', () => {
		expect(readerNumber('user_509a')).toBe('509A');
		expect(readerNumber('abc')).toBe('0ABC');
		expect(readerNumber('---')).toBe('0000');
	});

	it('strips uuid punctuation from a supabase id', () => {
		expect(readerNumber('qxlr-dyoa-qnko-ezja-csjv')).toBe('CSJV');
	});
});

describe('authorLine', () => {
	it('formats one, two, many, and missing authors', () => {
		expect(authorLine([])).toBe('Neznámy autor');
		expect(authorLine([{ name: 'Ján Test' }])).toBe('Ján Test');
		expect(authorLine([{ name: 'A' }, { name: 'B' }])).toBe('A & B');
		expect(authorLine([{ name: 'A' }, { name: 'B' }, { name: 'C' }])).toBe('A a kol.');
	});
});

describe('stampDate', () => {
	it('prints a numeric Slovak date', () => {
		expect(stampDate(new Date(2026, 7, 23))).toMatch(/23\.\s?08?\.\s?2026/);
	});
});

describe('dueStatus', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 7, 23, 12, 0, 0));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('marks a comfortable deadline as ok', () => {
		expect(dueStatus(new Date(2026, 7, 30)).tone).toBe('ok');
		expect(dueStatus(new Date(2026, 7, 30)).label).toMatch(/30/);
	});

	it('warns when a few days remain', () => {
		expect(dueStatus(new Date(2026, 7, 25))).toEqual({ tone: 'soon', label: 'Ešte 3 dni' });
		expect(dueStatus(new Date(2026, 7, 24))).toEqual({ tone: 'soon', label: 'Ešte 2 dni' });
		expect(dueStatus(new Date(2026, 7, 23))).toEqual({ tone: 'soon', label: 'Zajtra splatné' });
	});

	it('treats the day after the due calendar day as return-today', () => {
		expect(dueStatus(new Date(2026, 7, 22))).toEqual({ tone: 'soon', label: 'Vrátiť dnes' });
	});

	it('counts late days after that', () => {
		expect(dueStatus(new Date(2026, 7, 21))).toEqual({ tone: 'late', label: '1 deň po lehote' });
		expect(dueStatus(new Date(2026, 7, 20))).toEqual({ tone: 'late', label: '2 dni po lehote' });
	});
});
