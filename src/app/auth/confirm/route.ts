import { redirect } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeAuthNext } from '@/server/auth-message';
import { createSupabaseServer } from '@/server/session';

export async function GET(request: Request) {
	const url = new URL(request.url);
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;
	const next = safeAuthNext(
		url.searchParams.get('next'),
		type === 'recovery' ? '/login/password' : type === 'reauthentication' ? '/profile' : '/loans'
	);

	const supabase = await createSupabaseServer();
	if (supabase) {
		if (tokenHash && type) {
			const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
			if (!error) redirect(next);
		}
		const code = url.searchParams.get('code');
		if (code) {
			const { error } = await supabase.auth.exchangeCodeForSession(code);
			if (!error) redirect(next);
		}
	}

	redirect('/auth/error');
}
