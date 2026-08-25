import { isHttpError, isRedirect } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
	dev: false,
	browser: false,
	building: false
}));

vi.mock('$env/dynamic/private', () => ({
	env: { ADMIN_EMAILS: 'anna@spst.sk' }
}));

import { canOpenDesk, deskGate, isAdminEmail, requireAdmin } from '../admin-access';

const librarian = {
	id: 'user-1',
	name: 'Anna Pult',
	email: 'anna@spst.sk',
	role: 'librarian' as const
};

describe('requireAdmin', () => {
	it('sends a guest to login', () => {
		try {
			requireAdmin(undefined);
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) {
				expect(error.status).toBe(302);
				expect(error.location).toBe('/login');
			}
		}
	});

	it('stamps a reader even when the address is on the bootstrap list', () => {
		try {
			requireAdmin({ ...librarian, role: 'reader' });
			throw new Error('expected forbidden');
		} catch (error) {
			expect(isHttpError(error)).toBe(true);
			if (isHttpError(error)) {
				expect(error.status).toBe(403);
				expect(error.body).toMatchObject({ message: 'Pult je len pre správu fondu.' });
			}
		}
	});

	it('returns the librarian pass even when the address is not listed', () => {
		const other = { ...librarian, email: 'iny@spst.sk' };
		expect(requireAdmin(other)).toEqual(other);
	});
});

describe('canOpenDesk', () => {
	const reader = { ...librarian, role: 'reader' as const };

	it('keeps a reader off the desk in production', () => {
		expect(canOpenDesk(reader, false)).toBe(false);
		expect(canOpenDesk(undefined, true)).toBe(false);
	});

	it('lets a librarian manage the desk', () => {
		expect(canOpenDesk(librarian, false)).toBe(true);
	});

	it('lets a signed-in reader through in local dev', () => {
		expect(canOpenDesk(reader, true)).toBe(true);
	});
});

describe('isAdminEmail', () => {
	it('matches the bootstrap list, a wildcard, and ignores blanks', () => {
		expect(isAdminEmail('anna@spst.sk')).toBe(true);
		expect(isAdminEmail(' Anna@SPST.sk ')).toBe(true);
		expect(isAdminEmail('iny@spst.sk')).toBe(false);
		expect(isAdminEmail('')).toBe(false);
		expect(isAdminEmail(null)).toBe(false);
		expect(isAdminEmail('kto@spst.sk', '*')).toBe(true);
		expect(isAdminEmail('kto@spst.sk', 'a@spst.sk, kto@spst.sk')).toBe(true);
	});
});

describe('deskGate', () => {
	it('lets the hall through and guards the copper drawers', () => {
		expect(deskGate('/books', undefined)).toBe('ok');
		expect(deskGate('/admin', undefined)).toBe('login');
		expect(deskGate('/admin/books', { ...librarian, role: 'reader' })).toBe('forbidden');
		expect(deskGate('/admin/books', librarian)).toBe('ok');
	});
});
