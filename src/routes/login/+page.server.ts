import { fail, isRedirect, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { slovakAuthMessage } from '$lib/server/auth-message';
import { ensureLocalReader } from '$lib/server/readers';
import { supabasePublic } from '$lib/supabase/config';
import { hasFieldErrors, validateSignIn, validateSignUp } from '$lib/auth-fields';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, '/loans');
	}

	return {
		mode: url.searchParams.get('mod') === 'novy' ? 'novy' : 'vstup',
		configured: supabasePublic().configured
	};
};

export const actions: Actions = {
	signIn: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const errors = validateSignIn({ email, password });

		if (hasFieldErrors(errors)) {
			return fail(400, { errors, values: { email }, mode: 'vstup' as const });
		}

		if (!event.locals.supabase) {
			return fail(503, {
				message: 'Prihlásenie nie je nastavené. Chýba Supabase v .env.',
				values: { email },
				mode: 'vstup' as const
			});
		}

		try {
			const { data, error } = await event.locals.supabase.auth.signInWithPassword({
				email: email.trim(),
				password
			});
			if (error || !data.user) {
				return fail(400, {
					message: slovakAuthMessage(error?.message, 'Prihlásenie zlyhalo.'),
					values: { email },
					mode: 'vstup' as const
				});
			}

			ensureLocalReader({
				id: data.user.id,
				email: data.user.email ?? email,
				name: String(data.user.user_metadata?.name ?? '')
			});
		} catch (cause) {
			if (isRedirect(cause)) throw cause;
			return fail(400, {
				message: 'Prihlásenie teraz neprešlo. Skús to znova.',
				values: { email },
				mode: 'vstup' as const
			});
		}

		redirect(302, '/loans');
	},
	signUp: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const confirm = formData.get('confirm')?.toString() ?? '';
		const name = formData.get('name')?.toString() ?? '';
		const errors = validateSignUp({ name, email, password, confirm });

		if (hasFieldErrors(errors)) {
			return fail(400, {
				errors,
				values: { name, email },
				mode: 'novy' as const
			});
		}

		if (!event.locals.supabase) {
			return fail(503, {
				message: 'Registrácia nie je nastavená. Chýba Supabase v .env.',
				values: { name, email },
				mode: 'novy' as const
			});
		}

		try {
			const { data, error } = await event.locals.supabase.auth.signUp({
				email: email.trim(),
				password,
				options: {
					data: { name: name.trim() },
					emailRedirectTo: `${event.url.origin}/auth/confirm?next=/loans`
				}
			});

			if (error) {
				return fail(400, {
					message: slovakAuthMessage(error.message, 'Registrácia zlyhala.'),
					values: { name, email },
					mode: 'novy' as const
				});
			}

			if (data.user?.identities && data.user.identities.length === 0) {
				return fail(400, {
					message: 'Tento e-mail už má účet. Prihlás sa, alebo obnov heslo.',
					values: { name, email },
					mode: 'novy' as const
				});
			}

			if (!data.session || !data.user) {
				return {
					ok: true,
					mode: 'novy' as const,
					message: 'Skontroluj e-mail a potvrď účet. Potom sa môžeš prihlásiť.'
				};
			}

			ensureLocalReader({
				id: data.user.id,
				email: data.user.email ?? email,
				name: name.trim()
			});
		} catch (cause) {
			if (isRedirect(cause)) throw cause;
			return fail(400, {
				message: 'Registrácia teraz neprešla. Skús to znova.',
				values: { name, email },
				mode: 'novy' as const
			});
		}

		redirect(302, '/loans');
	}
};
