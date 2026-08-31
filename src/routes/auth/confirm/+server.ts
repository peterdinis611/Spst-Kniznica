import { redirect } from '@sveltejs/kit';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { RequestHandler } from './$types';
import { safeAuthNext } from '$lib/server/auth-message';

export const GET: RequestHandler = async ({ url, locals }) => {
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;
	const next = safeAuthNext(
		url.searchParams.get('next'),
		type === 'recovery' ? '/login/password' : type === 'reauthentication' ? '/profile' : '/loans'
	);

	const redirectTo = new URL(url);
	redirectTo.pathname = next;
	redirectTo.searchParams.delete('token_hash');
	redirectTo.searchParams.delete('type');
	redirectTo.searchParams.delete('next');

	if (locals.supabase) {
		if (tokenHash && type) {
			const { error } = await locals.supabase.auth.verifyOtp({ type, token_hash: tokenHash });
			if (!error) {
				redirect(303, `${redirectTo.pathname}${redirectTo.search}`);
			}
		}

		const code = url.searchParams.get('code');
		if (code) {
			const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
			if (!error) {
				redirect(303, `${redirectTo.pathname}${redirectTo.search}`);
			}
		}
	}

	redirect(303, '/auth/error');
};
