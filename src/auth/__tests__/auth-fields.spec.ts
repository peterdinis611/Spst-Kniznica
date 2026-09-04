import { describe, expect, it } from 'vitest';
import {
	hasFieldErrors,
	passwordStrength,
	validateNewPassword,
	validateResetEmail,
	validateSignIn,
	validateSignUp
} from '../auth-fields';

describe('validateSignIn', () => {
	it('accepts a complete login', () => {
		expect(hasFieldErrors(validateSignIn({ email: 'anna@spst.sk', password: 'heslo123' }))).toBe(
			false
		);
	});

	it('rejects a missing address and a short password', () => {
		const errors = validateSignIn({ email: 'nie', password: '123' });
		expect(errors.email).toMatch(/adresa/);
		expect(errors.password).toMatch(/8 znakov/);
	});
});

describe('validateSignUp', () => {
	it('wants a letter, a digit, and a matching confirm', () => {
		expect(
			hasFieldErrors(
				validateSignUp({
					name: 'Anna Pult',
					email: 'anna@spst.sk',
					password: 'kniha12a',
					confirm: 'kniha12a'
				})
			)
		).toBe(false);

		const errors = validateSignUp({
			name: 'A',
			email: 'anna@spst.sk',
			password: 'abcdefgh',
			confirm: 'ine'
		});
		expect(errors.name).toMatch(/dve písmená/);
		expect(errors.password).toMatch(/číslicu/);
		expect(errors.confirm).toMatch(/nezhodujú/);
	});
});

describe('validateNewPassword', () => {
	it('requires the confirm field', () => {
		expect(validateNewPassword({ password: 'kniha12a', confirm: '' }).confirm).toMatch(/Zopakuj/);
	});
});

describe('validateResetEmail', () => {
	it('wants a real address', () => {
		expect(validateResetEmail({ email: '' }).email).toMatch(/Zadaj e-mail/);
		expect(validateResetEmail({ email: 'anna@spst.sk' }).email).toBeUndefined();
	});
});

describe('passwordStrength', () => {
	it('scores empty, weak, and firm passwords', () => {
		expect(passwordStrength('')).toBe(0);
		expect(passwordStrength('abcdefg1')).toBe(2);
		expect(passwordStrength('kniha-pult-12')).toBe(3);
	});
});
