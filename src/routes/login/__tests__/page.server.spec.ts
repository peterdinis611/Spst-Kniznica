import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureLocalReader } from '$lib/server/readers';
import { supabasePublic } from '$lib/supabase/config';
import { actions, load } from '../+page.server';

vi.mock('$lib/supabase/config', () => ({
	supabasePublic: vi.fn(() => ({ url: 'http://supabase.test', key: 'anon', configured: true }))
}));

vi.mock('$lib/server/readers', () => ({
	ensureLocalReader: vi.fn()
}));

const reader = {
	id: 'user-509a',
	name: 'Peter Dinis',
	email: 'peter@spst.sk',
	role: 'reader' as const
};

function event(
	body: Record<string, string>,
	supabase?: {
		auth: {
			signInWithPassword?: ReturnType<typeof vi.fn>;
			signUp?: ReturnType<typeof vi.fn>;
		};
	},
	client?: { ip: string; ua?: string }
) {
	return {
		locals: { user: undefined, supabase },
		url: new URL('http://localhost/login'),
		getClientAddress: client ? () => client.ip : undefined,
		request: {
			headers: {
				get: (name: string) =>
					name.toLowerCase() === 'user-agent' ? (client?.ua ?? 'SPST-test') : null
			},
			formData: async () => {
				const data = new FormData();
				for (const [key, value] of Object.entries(body)) data.set(key, value);
				return data;
			}
		}
	} as unknown as Parameters<typeof actions.signIn>[0];
}

describe('login load', () => {
	it('sends a signed-in reader to loans', async () => {
		try {
			await load({
				locals: { user: reader },
				url: new URL('http://localhost/login')
			} as Parameters<typeof load>[0]);
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/loans');
		}
	});

	it('opens the new-pass form from ?mod=novy', async () => {
		const data = await load({
			locals: {},
			url: new URL('http://localhost/login?mod=novy')
		} as Parameters<typeof load>[0]);

		expect(data).toEqual({ mode: 'novy', configured: true });
	});

	it('defaults to the sign-in stamp', async () => {
		vi.mocked(supabasePublic).mockReturnValueOnce({
			url: '',
			key: '',
			configured: false
		});

		const data = await load({
			locals: {},
			url: new URL('http://localhost/login')
		} as Parameters<typeof load>[0]);

		expect(data).toEqual({ mode: 'vstup', configured: false });
	});
});

describe('login signIn', () => {
	beforeEach(() => {
		vi.mocked(ensureLocalReader).mockReset();
	});

	it('rejects an empty slip', async () => {
		const result = await actions.signIn(event({ email: '', password: '' }));

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.status).toBe(400);
			expect(result.data).toMatchObject({ mode: 'vstup' });
		}
	});

	it('fails when Auth is not wired', async () => {
		const result = await actions.signIn(
			event({ email: 'peter@spst.sk', password: 'heslo1234' })
		);

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.status).toBe(503);
			expect(result.data).toMatchObject({
				message: expect.stringMatching(/Supabase/),
				mode: 'vstup'
			});
		}
	});

	it('keeps a bad password on the login stamp', async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({
			data: { user: null },
			error: { message: 'Invalid login credentials' }
		});

		const result = await actions.signIn(
			event({ email: 'peter@spst.sk', password: 'heslo1234' }, { auth: { signInWithPassword } })
		);

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.data).toMatchObject({
				message: 'Nesprávny e-mail alebo heslo.',
				values: { email: 'peter@spst.sk' },
				mode: 'vstup'
			});
		}
	});

	it('stamps a local reader and opens loans', async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({
			data: {
				user: {
					id: reader.id,
					email: reader.email,
					user_metadata: { name: reader.name, role: 'reader' }
				}
			},
			error: null
		});

		try {
			await actions.signIn(
				event({ email: reader.email, password: 'heslo1234' }, { auth: { signInWithPassword } })
			);
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/loans');
		}

		expect(ensureLocalReader).toHaveBeenCalledWith({
			id: reader.id,
			email: reader.email,
			name: reader.name,
			role: 'reader'
		});
	});

	it('holds the stamp after too many password tries', async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({
			data: { user: null },
			error: { message: 'Invalid login credentials' }
		});
		const ip = `198.51.100.${1 + Math.floor(Math.random() * 200)}`;
		const body = { email: 'peter@spst.sk', password: 'heslo1234' };
		const client = { ip, ua: 'SPST-test' };

		for (let n = 0; n < 8; n += 1) {
			const result = await actions.signIn(event(body, { auth: { signInWithPassword } }, client));
			expect(isActionFailure(result)).toBe(true);
			if (isActionFailure(result)) expect(result.status).toBe(400);
		}

		const blocked = await actions.signIn(event(body, { auth: { signInWithPassword } }, client));
		expect(isActionFailure(blocked)).toBe(true);
		if (isActionFailure(blocked)) {
			expect(blocked.status).toBe(429);
			expect(blocked.data).toMatchObject({
				message: 'Príliš veľa pokusov. Počkaj chvíľu a skús to znova.',
				mode: 'vstup'
			});
		}
	});
});

describe('login signUp', () => {
	beforeEach(() => {
		vi.mocked(ensureLocalReader).mockReset();
	});

	it('rejects a thin registration slip', async () => {
		const result = await actions.signUp(
			event({ name: 'P', email: 'nie', password: 'abc', confirm: 'x' })
		);

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.status).toBe(400);
			expect(result.data).toMatchObject({ mode: 'novy', values: { name: 'P', email: 'nie' } });
		}
	});

	it('fails when Auth is not wired', async () => {
		const result = await actions.signUp(
			event({
				name: 'Peter Dinis',
				email: 'peter@spst.sk',
				password: 'kniha12a',
				confirm: 'kniha12a'
			})
		);

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.status).toBe(503);
			expect(result.data).toMatchObject({ mode: 'novy' });
		}
	});

	it('blocks an address that already has a pass', async () => {
		const signUp = vi.fn().mockResolvedValue({
			data: { user: { id: 'u1', identities: [] }, session: null },
			error: null
		});

		const result = await actions.signUp(
			event(
				{
					name: 'Peter Dinis',
					email: 'peter@spst.sk',
					password: 'kniha12a',
					confirm: 'kniha12a'
				},
				{ auth: { signUp } }
			)
		);

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.data).toMatchObject({
				message: 'Tento e-mail už má účet. Prihlás sa, alebo obnov heslo.',
				mode: 'novy'
			});
		}
	});

	it('asks to confirm e-mail and keeps the filled name', async () => {
		const signUp = vi.fn().mockResolvedValue({
			data: {
				user: { id: 'u1', identities: [{ id: 'ident-1' }] },
				session: null
			},
			error: null
		});

		const result = await actions.signUp(
			event(
				{
					name: 'Peter Dinis',
					email: 'peter@spst.sk',
					password: 'kniha12a',
					confirm: 'kniha12a'
				},
				{ auth: { signUp } }
			)
		);

		expect(result).toEqual({
			ok: true,
			mode: 'novy',
			message: 'Skontroluj e-mail a potvrď účet. Potom sa môžeš prihlásiť.',
			values: { name: 'Peter Dinis', email: 'peter@spst.sk' }
		});
		expect(ensureLocalReader).not.toHaveBeenCalled();
	});

	it('opens loans when Auth returns a session', async () => {
		const signUp = vi.fn().mockResolvedValue({
			data: {
				user: {
					id: reader.id,
					email: reader.email,
					identities: [{ id: 'ident-1' }],
					user_metadata: { role: 'reader' }
				},
				session: { access_token: 'tok' }
			},
			error: null
		});

		try {
			await actions.signUp(
				event(
					{
						name: reader.name,
						email: reader.email,
						password: 'kniha12a',
						confirm: 'kniha12a'
					},
					{ auth: { signUp } }
				)
			);
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/loans');
		}

		expect(ensureLocalReader).toHaveBeenCalledWith({
			id: reader.id,
			email: reader.email,
			name: reader.name,
			role: 'reader'
		});
	});
});
