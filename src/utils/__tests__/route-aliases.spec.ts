import { describe, expect, it } from 'vitest';
import { aliasTarget } from '../route-aliases';

describe('aliasTarget', () => {
	it('rewrites the public Slovak hall paths', () => {
		expect(aliasTarget('/knihy')).toBe('/books');
		expect(aliasTarget('/knihy/stroje-1')).toBe('/books/stroje-1');
		expect(aliasTarget('/knihy', '?q=stroje')).toBe('/books?q=stroje');
		expect(aliasTarget('/vsetky-knihy')).toBe('/holdings');
		expect(aliasTarget('/odbory/informatika')).toBe('/departments/informatika');
		expect(aliasTarget('/autori')).toBe('/authors');
		expect(aliasTarget('/vypozicky')).toBe('/loans');
		expect(aliasTarget('/preukaz')).toBe('/profile');
		expect(aliasTarget('/profil')).toBe('/profile');
		expect(aliasTarget('/prihlasenie')).toBe('/login');
		expect(aliasTarget('/zabudnute-heslo')).toBe('/login/recovery');
		expect(aliasTarget('/nove-heslo')).toBe('/login/password');
		expect(aliasTarget('/odhlasenie')).toBe('/logout');
	});

	it('rewrites the old auth and desk drawers', () => {
		expect(aliasTarget('/login/obnova')).toBe('/login/recovery');
		expect(aliasTarget('/login/heslo')).toBe('/login/password');
		expect(aliasTarget('/pult')).toBe('/admin');
		expect(aliasTarget('/pult/knihy')).toBe('/admin/knihy');
		expect(aliasTarget('/admin/odbory')).toBe('/admin/departments');
		expect(aliasTarget('/admin/knihy/stroje-1')).toBe('/admin/books/stroje-1');
		expect(aliasTarget('/admin/vazby')).toBe('/admin/book-authors');
		expect(aliasTarget('/admin/vytlacky')).toBe('/admin/holdings');
		expect(aliasTarget('/admin/vypozicky')).toBe('/admin/loans');
		expect(aliasTarget('/admin/rezervacie')).toBe('/admin/reservations');
		expect(aliasTarget('/admin/citately')).toBe('/admin/readers');
		expect(aliasTarget('/admin/vykazy')).toBe('/admin/reports');
		expect(aliasTarget('/admin/fronta')).toBe('/admin/queue');
		expect(aliasTarget('/admin/autori')).toBe('/admin/authors');
	});

	it('keeps a registration query and leaves English paths alone', () => {
		expect(aliasTarget('/registracia')).toBe('/login?mod=novy');
		expect(aliasTarget('/registracia', '?utm=1')).toBe('/login?mod=novy');
		expect(aliasTarget('/books')).toBeNull();
		expect(aliasTarget('/admin/books')).toBeNull();
		expect(aliasTarget('/login')).toBeNull();
	});
});
