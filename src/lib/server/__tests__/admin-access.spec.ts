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

import { requireAdmin } from '../admin-access';

const librarian = { id: 'user-1', name: 'Anna Pult', email: 'anna@spst.sk' };

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

	it('stamps a reader who is not on the desk list', () => {
		try {
			requireAdmin({ ...librarian, email: 'ziak@spst.sk' });
			throw new Error('expected forbidden');
		} catch (error) {
			expect(isHttpError(error)).toBe(true);
			if (isHttpError(error)) {
				expect(error.status).toBe(403);
				expect(error.body).toMatchObject({ message: 'Pult je len pre správu fondu.' });
			}
		}
	});

	it('returns the librarian pass', () => {
		expect(requireAdmin(librarian)).toEqual(librarian);
	});
});
