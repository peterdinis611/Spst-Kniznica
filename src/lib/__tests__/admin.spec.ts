import { describe, expect, it } from 'vitest';
import { slugify, toDatetimeLocal } from '../admin';
import { isAdminEmail } from '../server/admin-access';

describe('slugify', () => {
	it('strips Slovak diacritics and fills gaps', () => {
		expect(slugify('Informatika')).toBe('informatika');
		expect(slugify('Ján Belko')).toBe('jan-belko');
		expect(slugify('  ')).toBe('zaznam');
	});
});

describe('toDatetimeLocal', () => {
	it('formats a local stamp for the ledger form', () => {
		expect(toDatetimeLocal(new Date(2026, 7, 24, 9, 5))).toBe('2026-08-24T09:05');
		expect(toDatetimeLocal(null)).toBe('');
	});
});

describe('isAdminEmail', () => {
	it('matches a listed address', () => {
		expect(isAdminEmail('Knihovnik@spst.sk', 'knihovnik@spst.sk,pult@spst.sk', false)).toBe(true);
		expect(isAdminEmail('ziak@spst.sk', 'knihovnik@spst.sk', false)).toBe(false);
	});

	it('opens the desk to everyone when the list is a star', () => {
		expect(isAdminEmail('kdokolvek@spst.sk', '*', false)).toBe(true);
	});

	it('lets a signed-in reader through in local dev when the list is empty', () => {
		expect(isAdminEmail('peter@spst.sk', '', true)).toBe(true);
		expect(isAdminEmail('peter@spst.sk', '', false)).toBe(false);
		expect(isAdminEmail('', '', true)).toBe(false);
	});
});
