import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { actions, load } from '../+page.server';

vi.mock('$lib/supabase/config', () => ({
	supabasePublic: () => ({ url: 'http://supabase.test', key: 'anon', configured: true })
}));

const reader = {
	id: 'user-509a',
	name: 'Peter Dinis',
	email: 'peter@spst.sk',
	role: 'reader' as const
};

function event(
	body: Record<string, string>,
	supabase?: { auth: { updateUser: ReturnType<typeof vi.fn> } }
) {
	return {
		locals: { user: reader, supabase },
		url: new URL('http://localhost/login/password'),
		request: {
			formData: async () => {
				const data = new FormData();
				for (const [key, value] of Object.entries(body)) data.set(key, value);
				return data;
			}
		}
	} as unknown as Parameters<typeof actions.default>[0];
}

describe('password load', () => {
	it('sends a guest back to recovery', async () => {
		try {
			await load({ locals: {} } as Parameters<typeof load>[0]);
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/login/recovery');
		}
	});

	it('opens the stamp for a signed-in reader', async () => {
		const data = await load({ locals: { user: reader } } as Parameters<typeof load>[0]);

		expect(data).toEqual({ configured: true });
	});
});

describe('password action', () => {
	it('rejects a thin password pair', async () => {
		const result = await actions.default(event({ password: 'abc', confirm: '' }));

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) expect(result.status).toBe(400);
	});

	it('fails when Auth is not wired', async () => {
		const result = await actions.default(event({ password: 'kniha12a', confirm: 'kniha12a' }));

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) expect(result.status).toBe(503);
	});

	it('keeps a provider fault on the slip', async () => {
		const updateUser = vi.fn().mockResolvedValue({
			error: { message: 'New password should be different from the old password.' }
		});

		const result = await actions.default(
			event({ password: 'kniha12a', confirm: 'kniha12a' }, { auth: { updateUser } })
		);

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.data).toMatchObject({
				message: 'Nové heslo musí byť iné ako doterajšie.'
			});
		}
	});

	it('opens loans after a saved password', async () => {
		const updateUser = vi.fn().mockResolvedValue({ error: null });

		try {
			await actions.default(
				event({ password: 'kniha12a', confirm: 'kniha12a' }, { auth: { updateUser } })
			);
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/loans');
		}
	});
});
