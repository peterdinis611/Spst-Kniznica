import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { GET } from '../+server';

function event(
	search: string,
	supabase?: {
		auth: {
			verifyOtp?: ReturnType<typeof vi.fn>;
			exchangeCodeForSession?: ReturnType<typeof vi.fn>;
		};
	}
) {
	return {
		url: new URL(`http://localhost/auth/confirm${search}`),
		locals: { supabase }
	} as unknown as Parameters<typeof GET>[0];
}

describe('auth confirm', () => {
	it('drops an open redirect and fails without a token', async () => {
		try {
			await GET(event('?next=https://evil.example/loans'));
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/auth/error');
		}
	});

	it('opens loans after a confirmed hash', async () => {
		const verifyOtp = vi.fn().mockResolvedValue({ error: null });

		try {
			await GET(
				event('?token_hash=abc&type=email&next=/loans', { auth: { verifyOtp } })
			);
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) {
				expect(error.status).toBe(303);
				expect(error.location).toBe('/loans');
			}
		}

		expect(verifyOtp).toHaveBeenCalledWith({ type: 'email', token_hash: 'abc' });
	});

	it('sends a recovery confirm to the new-password stamp', async () => {
		const verifyOtp = vi.fn().mockResolvedValue({ error: null });

		try {
			await GET(
				event('?token_hash=abc&type=recovery', { auth: { verifyOtp } })
			);
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/login/password');
		}
	});

	it('exchanges a code for a session', async () => {
		const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });

		try {
			await GET(event('?code=pkce-1&next=/profile', { auth: { exchangeCodeForSession } }));
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/profile?code=pkce-1');
		}
	});

	it('fails when the hash does not verify', async () => {
		const verifyOtp = vi.fn().mockResolvedValue({ error: { message: 'expired' } });

		try {
			await GET(event('?token_hash=bad&type=email', { auth: { verifyOtp } }));
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/auth/error');
		}
	});
});
