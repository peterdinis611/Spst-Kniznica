import { describe, expect, it } from 'vitest';
import {
	PULT_TABLES,
	holdingLabel,
	reservationLabel,
	slugify,
	toDatetimeLocal
} from '../admin';
import { isAdminEmail } from '../server/admin-access';

describe('slugify', () => {
	it('strips Slovak diacritics and fills gaps', () => {
		expect(slugify('Informatika')).toBe('informatika');
		expect(slugify('Ján Belko')).toBe('jan-belko');
		expect(slugify('Ľudovít Štúr')).toBe('ludovit-stur');
		expect(slugify('C++ siete')).toBe('c-siete');
		expect(slugify('  ')).toBe('zaznam');
	});
});

describe('toDatetimeLocal', () => {
	it('formats a local stamp for the ledger form', () => {
		expect(toDatetimeLocal(new Date(2026, 7, 24, 9, 5))).toBe('2026-08-24T09:05');
		expect(toDatetimeLocal(null)).toBe('');
		expect(toDatetimeLocal('nie-datum')).toBe('');
	});
});

describe('ledger labels', () => {
	it('translates holding and reservation stamps', () => {
		expect(holdingLabel('available')).toBe('voľný');
		expect(holdingLabel('loaned')).toBe('vonku');
		expect(holdingLabel('mystery')).toBe('mystery');
		expect(reservationLabel('pending')).toBe('čaká');
		expect(reservationLabel('expired')).toBe('exspirovaná');
	});

	it('lists every drawer in the copper tabs', () => {
		expect(PULT_TABLES.map((item) => item.href)).toEqual([
			'/admin',
			'/admin/departments',
			'/admin/authors',
			'/admin/books',
			'/admin/book-authors',
			'/admin/holdings',
			'/admin/loans',
			'/admin/reservations',
			'/admin/readers'
		]);
	});
});

describe('isAdminEmail', () => {
	it('matches a listed address', () => {
		expect(isAdminEmail('Knihovnik@spst.sk', 'knihovnik@spst.sk,pult@spst.sk')).toBe(true);
		expect(isAdminEmail('ziak@spst.sk', 'knihovnik@spst.sk')).toBe(false);
	});

	it('opens the desk to everyone when the list is a star', () => {
		expect(isAdminEmail('kdokolvek@spst.sk', '*')).toBe(true);
	});

	it('does not treat a signed-in reader as a librarian when the list is empty', () => {
		expect(isAdminEmail('peter@spst.sk', '')).toBe(false);
		expect(isAdminEmail('', '*')).toBe(false);
		expect(isAdminEmail(null, '*')).toBe(false);
	});
});
