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

import { canOpenDesk, requireAdmin } from '../admin-access';

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

	it('lets a signed-in reader through in local dev', () => {
		expect(canOpenDesk(reader, true)).toBe(true);
		expect(canOpenDesk(librarian, false)).toBe(true);
	});
});
