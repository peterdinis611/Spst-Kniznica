import { slovakAuthMessage } from '@/server/auth-message';
import { sendRecoveryLetter } from '@/server/auth-mail';
import { mailReady } from '@/server/mail';
import { supabaseAdmin } from '@/server/supabase-admin';

export type PasswordResetClient = {
	auth: {
		resetPasswordForEmail: (
			email: string,
			opts: { redirectTo: string }
		) => Promise<{ error: { message: string } | null }>;
	};
};

export type PasswordResetResult =
	| { ok: true; mailed: boolean; via: 'pult' | 'supabase' }
	| { ok: false; message: string };

function recoveryHref(origin: string, tokenHash: string) {
	const url = new URL('/auth/confirm', origin);
	url.searchParams.set('token_hash', tokenHash);
	url.searchParams.set('type', 'recovery');
	url.searchParams.set('next', '/login/password');
	return url.toString();
}

function isRateLimit(message: string) {
	const text = message.toLowerCase();
	return text.includes('rate') || text.includes('seconds') || text.includes('too many');
}

export async function requestPasswordReset(input: {
	email: string;
	name?: string;
	origin: string;
	supabase: PasswordResetClient;
	mustExist?: boolean;
}): Promise<PasswordResetResult> {
	const email = input.email.trim();
	const origin = input.origin.replace(/\/$/, '');
	const redirectTo = `${origin}/auth/confirm?next=/login/password`;
	const admin = supabaseAdmin();

	if (admin && mailReady()) {
		const { data, error } = await admin.auth.admin.generateLink({
			type: 'recovery',
			email,
			options: { redirectTo }
		});

		if (error) {
			if (input.mustExist || isRateLimit(error.message)) {
				return {
					ok: false,
					message: slovakAuthMessage(error.message, 'Odkaz na obnovu sa teraz nepodarilo poslať.')
				};
			}
			return { ok: true, mailed: true, via: 'pult' };
		}

		const hash = data?.properties?.hashed_token;
		if (!hash) return { ok: true, mailed: false, via: 'pult' };

		const sent = await sendRecoveryLetter({
			to: email,
			name: input.name,
			href: recoveryHref(origin, hash),
			code: data?.properties?.email_otp
		});
		return { ok: true, mailed: sent.ok, via: 'pult' };
	}

	const { error } = await input.supabase.auth.resetPasswordForEmail(email, { redirectTo });
	if (error) {
		return {
			ok: false,
			message: slovakAuthMessage(error.message, 'Odkaz na obnovu sa teraz nepodarilo poslať.')
		};
	}

	return { ok: true, mailed: true, via: 'supabase' };
}
