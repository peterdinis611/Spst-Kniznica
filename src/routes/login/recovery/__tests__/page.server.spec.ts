import { isActionFailure } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { requestPasswordReset } from '$lib/server/password-reset';
import { pageOf } from '$lib/page-of';
import { actions, load } from '../+page.server';

vi.mock('$lib/supabase/config', () => ({
	supabasePublic: () => ({ url: 'http://supabase.test', key: 'anon', configured: true })
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

function event(email: string, supabase: unknown = { auth: {} }) {
	return {
		locals: { user: undefined, supabase },
		url: new URL('http://localhost/login/recovery'),
		request: {
			formData: async () => {
				const data = new FormData();
				data.set('email', email);
				return data;
			}
		}
	} as unknown as Parameters<typeof actions.default>[0];
}

describe('recovery load', () => {
	it('prefills the signed-in address', async () => {
		const data = pageOf(await load({ locals: { user: reader } } as Parameters<typeof load>[0]));

		expect(data).toEqual({ configured: true, email: reader.email });
	});

	it('leaves the field empty for a guest', async () => {
		const data = pageOf(await load({ locals: {} } as Parameters<typeof load>[0]));

		expect(data.email).toBe('');
	});
});

describe('recovery action', () => {
	it('rejects a missing address', async () => {
		const result = await actions.default(event(''));

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) expect(result.status).toBe(400);
	});

	it('fails when Auth is not wired', async () => {
		const result = await actions.default(
			{
				locals: { user: undefined },
				url: new URL('http://localhost/login/recovery'),
				request: {
					formData: async () => {
						const data = new FormData();
						data.set('email', 'peter@spst.sk');
						return data;
					}
				}
			} as unknown as Parameters<typeof actions.default>[0]
		);

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.status).toBe(503);
			expect(result.data).toMatchObject({ values: { email: 'peter@spst.sk' } });
		}
	});

	it('keeps a provider fault on the slip', async () => {
		vi.mocked(requestPasswordReset).mockResolvedValue({
			ok: false,
			message: 'E-mail nevyzerá ako adresa. Skús to znova.'
		});

		const result = await actions.default(event('peter@spst.sk'));

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.data).toMatchObject({
				message: 'E-mail nevyzerá ako adresa. Skús to znova.'
			});
		}
	});

	it('confirms that a recovery letter went out', async () => {
		vi.mocked(requestPasswordReset).mockResolvedValue({ ok: true, mailed: true, via: 'pult' });

		const result = await actions.default(event('peter@spst.sk'));

		expect(requestPasswordReset).toHaveBeenCalledWith({
			email: 'peter@spst.sk',
			name: undefined,
			origin: 'http://localhost',
			supabase: { auth: {} }
		});
		expect(result).toEqual({
			ok: true,
			message: 'Ak účet s touto adresou existuje, pošleme odkaz na obnovu hesla.'
		});
	});
});
