import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canOpenDesk } from '$lib/server/admin-access';
import { countActiveLoans } from '$lib/server/library';
import { actions, load } from '../+page.server';

vi.mock('$lib/server/library', () => ({
	countActiveLoans: vi.fn()
}));

vi.mock('$lib/server/admin-access', () => ({
	canOpenDesk: vi.fn()
}));

const reader = {
	id: 'user-509a',
	name: 'Peter Dinis',
	email: 'peter@spst.sk',
	role: 'reader' as const
};

function localsOf(user: typeof reader | undefined) {
	return { locals: { user } } as Parameters<typeof load>[0];
}

describe('profil load', () => {
	beforeEach(() => {
		vi.mocked(countActiveLoans).mockReset();
		vi.mocked(canOpenDesk).mockReset();
	});

	it('sends a guest to login', async () => {
		try {
			await load(localsOf(undefined));
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) {
				expect(error.status).toBe(302);
				expect(error.location).toBe('/login');
			}
		}
	});

	it('puts the pass, open loans and desk flag on the slip', async () => {
		vi.mocked(countActiveLoans).mockReturnValue(2);
		vi.mocked(canOpenDesk).mockReturnValue(false);

		const data = await load(localsOf(reader));

		expect(countActiveLoans).toHaveBeenCalledWith(reader.id);
		expect(data.reader).toEqual(reader);
		expect(data.activeCount).toBe(2);
		expect(data.admin).toBe(false);
	});
});

describe('profil recover', () => {
	it('sends a recovery letter to the signed-in address', async () => {
		const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
		const result = await actions.recover({
			locals: {
				user: reader,
				supabase: { auth: { resetPasswordForEmail } }
			},
			url: new URL('http://localhost/profile')
		} as Parameters<typeof actions.recover>[0]);

		expect(resetPasswordForEmail).toHaveBeenCalledWith('peter@spst.sk', {
			redirectTo: 'http://localhost/auth/confirm?next=/login/password'
		});
		expect(result).toEqual({
			ok: true,
			message: 'Odkaz na nové heslo ide na peter@spst.sk.'
		});
	});

	it('sends a guest to login', async () => {
		try {
			await actions.recover({
				locals: { user: undefined },
				url: new URL('http://localhost/profile')
			} as Parameters<typeof actions.recover>[0]);
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/login');
		}
	});

	it('fails when Auth is not wired', async () => {
		const result = await actions.recover({
			locals: { user: reader },
			url: new URL('http://localhost/profile')
		} as Parameters<typeof actions.recover>[0]);

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) expect(result.status).toBe(503);
	});
});
