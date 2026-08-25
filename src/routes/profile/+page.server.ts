import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { canOpenDesk } from '$lib/server/admin-access';
import { slovakAuthMessage } from '$lib/server/auth-message';
import { countActiveLoans } from '$lib/server/library';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	return {
		reader: {
			id: locals.user.id,
			name: locals.user.name,
			email: locals.user.email,
			role: locals.user.role
		},
		activeCount: countActiveLoans(locals.user.id),
		admin: canOpenDesk(locals.user)
	};
};

export const actions: Actions = {
	recover: async (event) => {
		if (!event.locals.user) {
			redirect(302, '/login');
		}

		if (!event.locals.supabase) {
			return fail(503, {
				message: 'Obnova hesla nie je nastavená. Chýba Supabase v .env.'
			});
		}

		const { error } = await event.locals.supabase.auth.resetPasswordForEmail(
			event.locals.user.email,
			{
				redirectTo: `${event.url.origin}/auth/confirm?next=/login/password`
			}
		);

		if (error) {
			return fail(400, {
				message: slovakAuthMessage(error.message, 'Odkaz na obnovu sa teraz nepodarilo poslať.')
			});
		}

		return {
			ok: true,
			message: `Odkaz na nové heslo ide na ${event.locals.user.email}.`
		};
	}
};
