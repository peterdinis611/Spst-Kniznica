import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { slovakAuthMessage } from '$lib/server/auth-message';
import { supabasePublic } from '$lib/supabase/config';
import { hasFieldErrors, validateResetEmail } from '$lib/auth-fields';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		configured: supabasePublic().configured,
		email: locals.user?.email ?? ''
	};
};

export const actions: Actions = {
	default: async (event) => {
		const email = (await event.request.formData()).get('email')?.toString() ?? '';
		const errors = validateResetEmail({ email });

		if (hasFieldErrors(errors)) {
			return fail(400, { errors, values: { email } });
		}

		if (!event.locals.supabase) {
			return fail(503, {
				message: 'Obnova hesla nie je nastavená. Chýba Supabase v .env.',
				values: { email }
			});
		}

		const { error } = await event.locals.supabase.auth.resetPasswordForEmail(email.trim(), {
			redirectTo: `${event.url.origin}/auth/confirm?next=/login/heslo`
		});

		if (error) {
			return fail(400, {
				message: slovakAuthMessage(error.message, 'Odkaz na obnovu sa teraz nepodarilo poslať.'),
				values: { email }
			});
		}

		return {
			ok: true,
			message: 'Ak účet s touto adresou existuje, pošleme odkaz na obnovu hesla.'
		};
	}
};
