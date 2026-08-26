import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canOpenDesk } from '$lib/server/admin-access';
import { sendPasswordChangedLetter } from '$lib/server/auth-mail';
import { countActiveLoans } from '$lib/server/library';
import { requestPasswordReset } from '$lib/server/password-reset';
import { pageOf } from '$lib/page-of';
import { actions, load } from '../+page.server';

vi.mock('$lib/server/library', () => ({
	countActiveLoans: vi.fn()
}));

vi.mock('$lib/server/admin-access', () => ({
	canOpenDesk: vi.fn()
}));

vi.mock('$lib/server/auth-mail', () => ({
	sendPasswordChangedLetter: vi.fn()
}));

vi.mock('$lib/server/password-reset', () => ({
	requestPasswordReset: vi.fn()
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

function event(
	action: 'password' | 'recover',
	body: Record<string, string> = {},
	supabase?: { auth: { updateUser?: ReturnType<typeof vi.fn> } }
) {
	return {
		locals: { user: reader, supabase },
		url: new URL('http://localhost/profile'),
		request: {
			formData: async () => {
				const data = new FormData();
				for (const [key, value] of Object.entries(body)) data.set(key, value);
				return data;
			}
		}
	} as unknown as Parameters<(typeof actions)[typeof action]>[0];
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
		vi.mocked(countActiveLoans).mockResolvedValue(2);
		vi.mocked(canOpenDesk).mockReturnValue(false);

		const data = pageOf(await load(localsOf(reader)));

		expect(countActiveLoans).toHaveBeenCalledWith(reader.id);
		expect(data.reader).toEqual(reader);
		expect(data.activeCount).toBe(2);
		expect(data.admin).toBe(false);
	});
});

describe('profil password', () => {
	beforeEach(() => {
		vi.mocked(sendPasswordChangedLetter).mockReset();
	});

	it('saves a new password and posts a confirmation letter', async () => {
		const updateUser = vi.fn().mockResolvedValue({ error: null });
		vi.mocked(sendPasswordChangedLetter).mockResolvedValue({ ok: true });

		const result = await actions.password(
			event('password', { password: 'kniha12a', confirm: 'kniha12a' }, { auth: { updateUser } })
		);

		expect(updateUser).toHaveBeenCalledWith({ password: 'kniha12a' });
		expect(sendPasswordChangedLetter).toHaveBeenCalledWith({
			to: 'peter@spst.sk',
			name: 'Peter Dinis',
			profileHref: 'http://localhost/profile'
		});
		expect(result).toEqual({
			ok: true,
			message: 'Heslo je nové. Potvrdenie ide na peter@spst.sk.'
		});
	});

	it('rejects a thin password pair', async () => {
		const result = await actions.password(event('password', { password: 'abc', confirm: '' }));
		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) expect(result.status).toBe(400);
	});
});

describe('profil recover', () => {
	beforeEach(() => {
		vi.mocked(requestPasswordReset).mockReset();
	});

	it('sends a recovery letter to the signed-in address', async () => {
		vi.mocked(requestPasswordReset).mockResolvedValue({ ok: true, mailed: true, via: 'pult' });

		const result = await actions.recover({
			locals: { user: reader, supabase: { auth: {} } },
			url: new URL('http://localhost/profile')
		} as Parameters<typeof actions.recover>[0]);

		expect(requestPasswordReset).toHaveBeenCalledWith({
			email: 'peter@spst.sk',
			name: 'Peter Dinis',
			origin: 'http://localhost',
			supabase: { auth: {} },
			mustExist: true
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
