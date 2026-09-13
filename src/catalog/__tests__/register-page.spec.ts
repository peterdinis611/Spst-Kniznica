import { describe, expect, it } from 'vitest';
import { clampRegisterPage, registerHref } from '../register-page';

describe('clampRegisterPage', () => {
	it('keeps the first leaf on an empty register', () => {
		expect(clampRegisterPage(undefined, 0)).toEqual({
			page: 1,
			pages: 1,
			pageSize: 48,
			offset: 0
		});
	});

	it('caps a stray page number', () => {
		expect(clampRegisterPage('99', 50).page).toBe(2);
		expect(clampRegisterPage('0', 50).page).toBe(1);
	});
});

describe('registerHref', () => {
	it('omits the first leaf from the address', () => {
		expect(registerHref('/books', { q: 'sql', odbor: 'informatika', page: 1 })).toBe(
			'/books?q=sql&odbor=informatika'
		);
		expect(registerHref('/holdings', { page: 3 })).toBe('/holdings?strana=3');
	});
});
