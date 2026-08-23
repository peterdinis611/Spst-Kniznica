import { describe, expect, it } from 'vitest';
import {
	hasBorrowErrors,
	normalizeClass,
	parseLoanDays,
	splitReaderName,
	validateBorrow
} from '../borrow-fields';

describe('splitReaderName', () => {
	it('splits a given name and family name', () => {
		expect(splitReaderName('Peter Dinis')).toEqual({ firstName: 'Peter', lastName: 'Dinis' });
		expect(splitReaderName('Ing. Jana Nová')).toEqual({ firstName: 'Jana', lastName: 'Nová' });
	});

	it('keeps a single word as the given name', () => {
		expect(splitReaderName('Peter')).toEqual({ firstName: 'Peter', lastName: '' });
	});
});

describe('validateBorrow', () => {
	it('accepts a complete slip', () => {
		expect(
			hasBorrowErrors(
				validateBorrow({
					firstName: 'Peter',
					lastName: 'Dinis',
					className: 'ii.a',
					days: '21'
				})
			)
		).toBe(false);
		expect(normalizeClass('ii.a')).toBe('II.A');
		expect(parseLoanDays('14')).toBe(14);
		expect(parseLoanDays('30')).toBe(30);
	});

	it('rejects a missing class and an invalid period', () => {
		const errors = validateBorrow({
			firstName: 'A',
			lastName: '',
			className: '',
			days: '0'
		});
		expect(errors.firstName).toMatch(/dve písmená/);
		expect(errors.lastName).toMatch(/Priezvisko/);
		expect(errors.className).toMatch(/triedu/i);
		expect(errors.days).toMatch(/dobu/);
	});

	it('accepts school class codes', () => {
		expect(validateBorrow({ firstName: 'Ján', lastName: 'Kováč', className: '3.INF', days: '7' }).className).toBeUndefined();
		expect(validateBorrow({ firstName: 'Ján', lastName: 'Kováč', className: '??', days: '7' }).className).toBeTruthy();
	});
});
