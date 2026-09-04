import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateLink = vi.fn();
const sendRecoveryLetter = vi.fn();
const supabaseAdmin = vi.fn();
const mailReady = vi.fn();

vi.mock('../supabase-admin', () => ({
	supabaseAdmin: () => supabaseAdmin()
}));

vi.mock('../mail', () => ({
	mailReady: () => mailReady()
}));

vi.mock('../auth-mail', () => ({
	sendRecoveryLetter: (...args: unknown[]) => sendRecoveryLetter(...args)
}));

import { requestPasswordReset } from '../password-reset';

const supabase = {
	auth: {
		resetPasswordForEmail: vi.fn()
	}
};

describe('requestPasswordReset', () => {
	beforeEach(() => {
		generateLink.mockReset();
		sendRecoveryLetter.mockReset();
		supabaseAdmin.mockReset();
		mailReady.mockReset();
		supabase.auth.resetPasswordForEmail.mockReset();
	});

	it('falls back to Supabase mail when the pult post is not wired', async () => {
		supabaseAdmin.mockReturnValue(null);
		mailReady.mockReturnValue(false);
		supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

		const result = await requestPasswordReset({
			email: 'peter@spst.sk',
			origin: 'http://localhost:5173',
			supabase
		});

		expect(result).toEqual({ ok: true, mailed: true, via: 'supabase' });
		expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('peter@spst.sk', {
			redirectTo: 'http://localhost:5173/auth/confirm?next=/login/password'
		});
		expect(sendRecoveryLetter).not.toHaveBeenCalled();
	});

	it('sends a pult letter when generateLink stamps a hash', async () => {
		supabaseAdmin.mockReturnValue({
			auth: { admin: { generateLink } }
		});
		mailReady.mockReturnValue(true);
		generateLink.mockResolvedValue({
			data: {
				properties: { hashed_token: 'tok-1', email_otp: '654321' }
			},
			error: null
		});
		sendRecoveryLetter.mockResolvedValue({ ok: true });

		const result = await requestPasswordReset({
			email: 'peter@spst.sk',
			name: 'Peter Dinis',
			origin: 'http://localhost:5173/',
			supabase
		});

		expect(result).toEqual({ ok: true, mailed: true, via: 'pult' });
		expect(generateLink).toHaveBeenCalledWith({
			type: 'recovery',
			email: 'peter@spst.sk',
			options: { redirectTo: 'http://localhost:5173/auth/confirm?next=/login/password' }
		});
		expect(sendRecoveryLetter).toHaveBeenCalledWith({
			to: 'peter@spst.sk',
			name: 'Peter Dinis',
			href: 'http://localhost:5173/auth/confirm?token_hash=tok-1&type=recovery&next=%2Flogin%2Fpassword',
			code: '654321'
		});
		expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
	});

	it('hides a missing account on the public recovery stamp', async () => {
		supabaseAdmin.mockReturnValue({
			auth: { admin: { generateLink } }
		});
		mailReady.mockReturnValue(true);
		generateLink.mockResolvedValue({
			data: { properties: {} },
			error: { message: 'User not found' }
		});

		const result = await requestPasswordReset({
			email: 'ghost@spst.sk',
			origin: 'http://localhost:5173',
			supabase
		});

		expect(result).toEqual({ ok: true, mailed: true, via: 'pult' });
		expect(sendRecoveryLetter).not.toHaveBeenCalled();
	});

	it('keeps a missing account as a fault on the signed-in pass', async () => {
		supabaseAdmin.mockReturnValue({
			auth: { admin: { generateLink } }
		});
		mailReady.mockReturnValue(true);
		generateLink.mockResolvedValue({
			data: { properties: {} },
			error: { message: 'User not found' }
		});

		const result = await requestPasswordReset({
			email: 'ghost@spst.sk',
			origin: 'http://localhost:5173',
			supabase,
			mustExist: true
		});

		expect(result).toMatchObject({ ok: false });
	});
});
