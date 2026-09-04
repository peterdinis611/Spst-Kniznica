'use server';

import { redirect } from 'next/navigation';
import { isActionFailure, isRedirect } from '@/http/kit';
import { hasFieldErrors, validateSignIn, validateSignUp } from '@/auth/auth-fields';
import { slovakAuthMessage } from '@/server/auth-message';
import { failIfRateLimited } from '@/server/rate-limit';
import { ensureLocalReader } from '@/server/readers';
import { actionEvent, createSupabaseServer, getSessionReader } from '@/server/session';
import { supabasePublic } from '@/config/supabase';
import { headers } from 'next/headers';

export type LoginState = {
	ok?: boolean;
	message?: string;
	mode?: 'vstup' | 'novy';
	errors?: { name?: string; email?: string; password?: string; confirm?: string };
	values?: { name?: string; email?: string };
};

export async function requireGuest() {
	const user = await getSessionReader();
	if (user) redirect('/loans');
}

export async function signInAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
	const email = formData.get('email')?.toString() ?? '';
	const password = formData.get('password')?.toString() ?? '';
	const errors = validateSignIn({ email, password });
	if (hasFieldErrors(errors)) {
		return { errors, values: { email }, mode: 'vstup' };
	}

	const blocked = await failIfRateLimited(await actionEvent(), 'auth', {
		values: { email },
		mode: 'vstup'
	});
	if (blocked && isActionFailure(blocked)) {
		return { message: blocked.data.message, values: { email }, mode: 'vstup' };
	}

	const supabase = await createSupabaseServer();
	if (!supabase) {
		return {
			message: 'Prihlásenie nie je nastavené. Chýba Supabase v .env.',
			values: { email },
			mode: 'vstup'
		};
	}

	try {
		const { data, error } = await supabase.auth.signInWithPassword({
			email: email.trim(),
			password
		});
		if (error || !data.user) {
			return {
				message: slovakAuthMessage(error?.message, 'Prihlásenie zlyhalo.'),
				values: { email },
				mode: 'vstup'
			};
		}
		await ensureLocalReader({
			id: data.user.id,
			email: data.user.email ?? email,
			name: String(data.user.user_metadata?.name ?? ''),
			role: data.user.user_metadata?.role
		});
	} catch (cause) {
		if (isRedirect(cause)) throw cause;
		return {
			message: 'Prihlásenie teraz neprešlo. Skús to znova.',
			values: { email },
			mode: 'vstup'
		};
	}

	redirect('/loans');
}

export async function signUpAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
	const email = formData.get('email')?.toString() ?? '';
	const password = formData.get('password')?.toString() ?? '';
	const confirm = formData.get('confirm')?.toString() ?? '';
	const name = formData.get('name')?.toString() ?? '';
	const errors = validateSignUp({ name, email, password, confirm });
	if (hasFieldErrors(errors)) {
		return { errors, values: { name, email }, mode: 'novy' };
	}

	const blocked = await failIfRateLimited(await actionEvent(), 'auth', {
		values: { name, email },
		mode: 'novy'
	});
	if (blocked && isActionFailure(blocked)) {
		return { message: blocked.data.message, values: { name, email }, mode: 'novy' };
	}

	const supabase = await createSupabaseServer();
	if (!supabase) {
		return {
			message: 'Registrácia nie je nastavená. Chýba Supabase v .env.',
			values: { name, email },
			mode: 'novy'
		};
	}

	const origin = (await headers()).get('origin') || supabasePublic().url;
	try {
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
				values: { name, email },
				mode: 'novy'
			};
		}
		if (data.user?.identities && data.user.identities.length === 0) {
			return {
				message: 'Tento e-mail už má účet. Prihlás sa, alebo obnov heslo.',
				values: { name, email },
				mode: 'novy'
			};
		}
		if (!data.session || !data.user) {
			return {
				ok: true,
				mode: 'novy',
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
	} catch (cause) {
		if (isRedirect(cause)) throw cause;
		return {
			message: 'Registrácia teraz neprešla. Skús to znova.',
			values: { name, email },
			mode: 'novy'
		};
	}

	redirect('/loans');
}
