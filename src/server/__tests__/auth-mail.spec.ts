import { describe, expect, it } from 'vitest';
import { passwordChangedMailCopy, recoveryMailCopy } from '../auth-mail';

describe('recoveryMailCopy', () => {
	it('stamps a recovery slip with the confirm link', () => {
		const copy = recoveryMailCopy({
			to: 'peter@spst.sk',
			name: 'Peter Dinis',
			href: 'http://localhost/auth/confirm?token_hash=abc&type=recovery&next=/login/password',
			code: '123456'
		});

		expect(copy.subject).toBe('Nové heslo · SPŠT knižnica');
		expect(copy.text).toContain('Peter Dinis');
		expect(copy.text).toContain('token_hash=abc');
		expect(copy.text).toContain('123456');
		expect(copy.html).toContain('Nastav nové heslo.');
		expect(copy.html).toContain('Nastaviť heslo');
		expect(copy.html).toContain('123456');
		expect(copy.html).not.toContain('<script>');
	});

	it('escapes a hostile name in HTML', () => {
		const copy = recoveryMailCopy({
			to: 'peter@spst.sk',
			name: '<img src=x onerror=alert(1)>',
			href: 'http://localhost/auth/confirm?token_hash=abc&type=recovery'
		});

		expect(copy.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
		expect(copy.html).not.toContain('<img src=x');
	});
});

describe('passwordChangedMailCopy', () => {
	it('stamps a confirmation after a saved password', () => {
		const copy = passwordChangedMailCopy({
			to: 'peter@spst.sk',
			name: 'Peter Dinis',
			profileHref: 'http://localhost/profile'
		});

		expect(copy.subject).toBe('Heslo je nové · SPŠT knižnica');
		expect(copy.text).toContain('/profile');
		expect(copy.html).toContain('Heslo je nové.');
		expect(copy.html).toContain('Otvoriť preukaz');
	});
});
