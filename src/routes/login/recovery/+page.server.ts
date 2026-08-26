import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabasePublic } from '$lib/supabase/config';
import { hasFieldErrors, validateResetEmail } from '$lib/auth-fields';
import { requestPasswordReset } from '$lib/server/password-reset';

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

		const result = await requestPasswordReset({
			email: email.trim(),
			name: event.locals.user?.name,
			origin: event.url.origin,
			supabase: event.locals.supabase
		});

		if (!result.ok) {
			return fail(400, { message: result.message, values: { email } });
		}

		if (!result.mailed) {
			return fail(400, {
				message: 'List s odkazom teraz neodišiel. Skontroluj Mailtrap alebo Mailgun v .env.',
				values: { email }
			});
		}

		return {
			ok: true,
			message: 'Ak účet s touto adresou existuje, pošleme odkaz na obnovu hesla.'
		};
	}
};
