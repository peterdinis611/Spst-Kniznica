import { pageMeta } from '@/utils/metadata';
import { AuthPass } from '@/components/AuthPass';
import { requestPasswordReset } from '@/server/password-reset';
import { failIfRateLimited } from '@/server/rate-limit';
import { actionEvent, createSupabaseServer, getSessionReader } from '@/server/session';
import { hasFieldErrors, validateResetEmail } from '@/auth/auth-fields';
import { supabasePublic } from '@/config/supabase';
import { isActionFailure } from '@/http/kit';
import { headers } from 'next/headers';

export const metadata = pageMeta({
	title: 'Obnova hesla',
	description: 'Obnov prístup k čitateľskému preukazu SPŠT.',
	index: false
});

async function recover(formData: FormData) {
	'use server';
	const email = formData.get('email')?.toString() ?? '';
	const errors = validateResetEmail({ email });
	if (hasFieldErrors(errors)) return;
	const blocked = await failIfRateLimited(await actionEvent(), 'mail');
	if (blocked && isActionFailure(blocked)) return;
	const supabase = await createSupabaseServer();
	if (!supabase) return;
	const origin = (await headers()).get('origin') || 'http://localhost:5173';
	const user = await getSessionReader();
	await requestPasswordReset({
		email: email.trim(),
		name: user?.name,
		origin,
		supabase
	});
}

export default function RecoveryPage() {
	const configured = supabasePublic().configured;
	return (
		<AuthPass
			kicker="Obnova"
			title="Zabudnuté heslo."
			lede="Zadaj e-mail. Ak máš účet, príde odkaz na nové heslo."
		>
			<form action={recover} className="pass-form">
				<div className="pass-field">
					<label htmlFor="email">E-mail</label>
					<input id="email" name="email" type="email" required autoComplete="email" />
				</div>
				{configured ? null : <p className="pass-note">Supabase v .env ešte nie je.</p>}
				<button className="pass-go" type="submit" disabled={!configured}>
					Poslať odkaz
				</button>
			</form>
		</AuthPass>
	);
}
