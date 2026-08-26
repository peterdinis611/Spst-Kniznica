import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../+server';

describe('logout', () => {
	it('signs out and returns to the hall', async () => {
		const signOut = vi.fn().mockResolvedValue({ error: null });

		try {
			await POST({
				locals: { supabase: { auth: { signOut } } }
			} as unknown as Parameters<typeof POST>[0]);
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) {
				expect(error.status).toBe(302);
				expect(error.location).toBe('/');
			}
		}

		expect(signOut).toHaveBeenCalled();
	});

	it('sends a GET visitor home', async () => {
		try {
			await GET({} as unknown as Parameters<typeof GET>[0]);
			throw new Error('expected redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/');
		}
	});
});
