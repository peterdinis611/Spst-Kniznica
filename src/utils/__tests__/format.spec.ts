import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	authorLine,
	booksLabel,
	catalogDate,
	copiesLabel,
	copiesShort,
	daysLabel,
	dueStatus,
	familyName,
	firstName,
	initials,
	loanedLabel,
	readerNumber,
	splitCallNumber,
	stampDate,
	volumesLabel
} from '../format';

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

describe('loanedLabel', () => {
	it('declines Slovak book counts on the pass', () => {
		expect(loanedLabel(0)).toBe('0 kníh');
		expect(loanedLabel(1)).toBe('1 kniha');
		expect(loanedLabel(3)).toBe('3 knihy');
		expect(loanedLabel(5)).toBe('5 kníh');
	});
});

describe('daysLabel', () => {
	it('declines Slovak day counts', () => {
		expect(daysLabel(1)).toBe('1 deň');
		expect(daysLabel(3)).toBe('3 dni');
		expect(daysLabel(21)).toBe('21 dní');
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

describe('catalog copy', () => {
	it('declines books, volumes, and free copies', () => {
		expect(booksLabel(1)).toBe('1 kniha vo fonde');
		expect(booksLabel(3)).toBe('3 knihy vo fonde');
		expect(booksLabel(8)).toBe('8 kníh vo fonde');
		expect(volumesLabel(1)).toBe('zväzok');
		expect(volumesLabel(3)).toBe('zväzky');
		expect(volumesLabel(12)).toBe('zväzkov');
		expect(copiesLabel(0, 3)).toBe('Nedostupné');
		expect(copiesLabel(1, 3)).toBe('1 voľný z 3');
		expect(copiesLabel(3, 5)).toBe('3 voľné z 5');
		expect(copiesLabel(8, 10)).toBe('8 voľných z 10');
	});

	it('splits a call number and the given name', () => {
		expect(splitCallNumber('INF 004.4 BEL')).toEqual({
			dept: 'INF',
			number: '004.4',
			cutter: 'BEL'
		});
		expect(firstName('Peter Dinis')).toBe('Peter');
		expect(copiesShort(0, 3)).toBe('0');
		expect(copiesShort(2, 5)).toBe('2/5');
		expect(initials('Ing. Peter Dinis')).toBe('PD');
		expect(initials('Peter')).toBe('PE');
		expect(familyName('Ing. Peter Dinis')).toBe('Dinis');
		expect(catalogDate(new Date(2026, 7, 25))).toMatch(/2026/);
	});
});
