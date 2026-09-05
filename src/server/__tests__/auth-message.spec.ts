import { describe, expect, it } from 'vitest';
import { safeAuthNext, slovakAuthMessage } from '../auth-message';

describe('slovakAuthMessage', () => {
	it('translates common Supabase faults', () => {
		expect(slovakAuthMessage('Invalid login credentials', 'x')).toBe(
			'Nesprávny e-mail alebo heslo.'
		);
		expect(slovakAuthMessage('Email not confirmed', 'x')).toMatch(/Potvrď účet/);
		expect(slovakAuthMessage('User already registered', 'x')).toMatch(/už má účet/);
		expect(slovakAuthMessage('Password should be at least 8 characters', 'x')).toMatch(/8 znakov/);
		expect(slovakAuthMessage('Unable to validate email address', 'x')).toMatch(/adresa/);
		expect(slovakAuthMessage('Session missing', 'x')).toMatch(/vypršal/);
		expect(slovakAuthMessage('something else', 'Skús znova.')).toBe('Skús znova.');
		expect(slovakAuthMessage('For security purposes you can only request this after', 'x')).toMatch(
			/Počkaj/
		);
		expect(slovakAuthMessage('New password should be different', 'x')).toMatch(
			/iné ako doterajšie/
		);
		expect(slovakAuthMessage('same password', 'x')).toMatch(/iné ako doterajšie/);
	});
});

describe('safeAuthNext', () => {
	it('keeps an in-app path and drops an open redirect', () => {
		expect(safeAuthNext('/admin')).toBe('/admin');
		expect(safeAuthNext('/loans')).toBe('/loans');
		expect(safeAuthNext('https://evil.example/loans')).toBe('/loans');
		expect(safeAuthNext('//evil.example')).toBe('/loans');
		expect(safeAuthNext('/\\evil.example')).toBe('/loans');
		expect(safeAuthNext(null, '/discover')).toBe('/discover');
	});
});
