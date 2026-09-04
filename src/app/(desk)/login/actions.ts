'use server';

import { redirect } from 'next/navigation';
import { returnServerError } from 'next-safe-action';
import { actionClient, authActionClient } from '@/http/safe-action';
import { signInSchema, signUpSchema, resetEmailSchema } from '@/auth/auth-fields';
import { slovakAuthMessage } from '@/server/auth-message';
import { failIfRateLimited } from '@/server/rate-limit';
import { ensureLocalReader } from '@/server/readers';
import { requestPasswordReset } from '@/server/password-reset';
import { actionEvent, createSupabaseServer, getSessionReader } from '@/server/session';
import { supabasePublic } from '@/config/supabase';
import { isActionFailure } from '@/http/kit';
import { headers } from 'next/headers';

export type LoginData = {
	ok?: boolean;
	message?: string;
	values?: { name?: string; email?: string };
};

export async function requireGuest() {
	const user = await getSessionReader();
	if (user) redirect('/loans');
}

export const signInAction = actionClient
	.inputSchema(signInSchema)
	.stateAction(async ({ parsedInput }): Promise<LoginData> => {
		const email = parsedInput.email;
		const blocked = await failIfRateLimited(await actionEvent(), 'auth');
		if (blocked && isActionFailure(blocked)) {
			returnServerError(blocked.data.message);
		}

		const supabase = await createSupabaseServer();
		if (!supabase) {
			returnServerError('Prihlásenie nie je nastavené. Chýba Supabase v .env.');
		}

		const { data, error } = await supabase.auth.signInWithPassword({
			email: email.trim(),
			password: parsedInput.password
		});
		if (error || !data.user) {
			return {
				message: slovakAuthMessage(error?.message, 'Prihlásenie zlyhalo.'),
				values: { email }
			};
		}
		await ensureLocalReader({
			id: data.user.id,
			email: data.user.email ?? email,
			name: String(data.user.user_metadata?.name ?? ''),
			role: data.user.user_metadata?.role
		});

		redirect('/loans');
	});

export const signUpAction = actionClient
	.inputSchema(signUpSchema)
	.stateAction(async ({ parsedInput }): Promise<LoginData> => {
		const { name, email, password } = parsedInput;
		const blocked = await failIfRateLimited(await actionEvent(), 'auth');
		if (blocked && isActionFailure(blocked)) {
			returnServerError(blocked.data.message);
		}

		const supabase = await createSupabaseServer();
		if (!supabase) {
			returnServerError('Registrácia nie je nastavená. Chýba Supabase v .env.');
		}

		const origin = (await headers()).get('origin') || supabasePublic().url;
		const { data, error } = await supabase.auth.signUp({
			email: email.trim(),
			password,
			options: {
				data: { name: name.trim() },
				emailRedirectTo: `${origin}/auth/confirm?next=/loans`
			}
		});
		if (error) {
			return {
				message: slovakAuthMessage(error.message, 'Registrácia zlyhala.'),
				values: { name, email }
			};
		}
		if (data.user?.identities && data.user.identities.length === 0) {
			return {
				message: 'Tento e-mail už má účet. Prihlás sa, alebo obnov heslo.',
				values: { name, email }
			};
		}
		if (!data.session || !data.user) {
			return {
				ok: true,
				message: 'Skontroluj e-mail a potvrď účet. Potom sa môžeš prihlásiť.',
				values: { name, email }
			};
		}
		await ensureLocalReader({
			id: data.user.id,
			email: data.user.email ?? email,
			name: name.trim(),
			role: data.user.user_metadata?.role
		});

		redirect('/loans');
	});

export const recoverAction = actionClient
	.inputSchema(resetEmailSchema)
	.stateAction(async ({ parsedInput }): Promise<LoginData> => {
		const blocked = await failIfRateLimited(await actionEvent(), 'mail');
		if (blocked && isActionFailure(blocked)) {
			returnServerError(blocked.data.message);
		}
		const supabase = await createSupabaseServer();
		if (!supabase) {
			returnServerError('Obnova hesla nie je nastavená. Chýba Supabase v .env.');
		}
		const origin = (await headers()).get('origin') || 'http://localhost:3000';
		const user = await getSessionReader();
		await requestPasswordReset({
			email: parsedInput.email.trim(),
			name: user?.name,
			origin,
			supabase
		});
		return {
			ok: true,
			message: 'Ak máš účet, príde odkaz na nové heslo.',
			values: { email: parsedInput.email }
		};
	});

export const requireReader = authActionClient.action(async ({ ctx }) => ctx.user);
