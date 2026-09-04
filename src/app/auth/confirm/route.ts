import { redirect } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { noticeHref, type NoticeKey } from '@/notify/notices';
import { safeAuthNext } from '@/server/auth-message';
import { createSupabaseServer } from '@/server/session';

function confirmNotice(type: EmailOtpType | null, next: string): NoticeKey | null {
	if (type === 'recovery') return null;
	if (type === 'signup' || type === 'invite' || type === 'email') return 'confirmed';
	if (next.startsWith('/auth/error')) return 'auth-fail';
	return 'login';
}

function go(next: string, type: EmailOtpType | null) {
	const key = confirmNotice(type, next);
	redirect(key ? noticeHref(next, key) : next);
}

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
			if (!error) go(next, type);
		}
		const code = url.searchParams.get('code');
		if (code) {
			const { error } = await supabase.auth.exchangeCodeForSession(code);
			if (!error) go(next, type);
		}
	}

	redirect(noticeHref('/auth/error', 'auth-fail'));
}
