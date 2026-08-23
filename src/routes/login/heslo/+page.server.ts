import { fail, isRedirect, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { slovakAuthMessage } from '$lib/server/auth-message';
import { supabasePublic } from '$lib/supabase/config';
import { hasFieldErrors, validateNewPassword } from '$lib/auth-fields';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login/obnova');
	}

	return { configured: supabasePublic().configured };
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const password = formData.get('password')?.toString() ?? '';
		const confirm = formData.get('confirm')?.toString() ?? '';
		const errors = validateNewPassword({ password, confirm });

		if (hasFieldErrors(errors)) {
			return fail(400, { errors });
		}

		if (!event.locals.supabase) {
			return fail(503, { message: 'Zmena hesla nie je nastavená. Chýba Supabase v .env.' });
		}

		try {
			const { error } = await event.locals.supabase.auth.updateUser({ password });
			if (error) {
				return fail(400, {
					message: slovakAuthMessage(error.message, 'Nové heslo sa nepodarilo uložiť.')
				});
			}
		} catch (cause) {
			if (isRedirect(cause)) throw cause;
			return fail(400, { message: 'Nové heslo sa nepodarilo uložiť.' });
		}

		redirect(302, '/loans');
	}
};
