import { fail, isRedirect, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { canOpenDesk } from '$lib/server/admin-access';
import { slovakAuthMessage } from '$lib/server/auth-message';
import { sendPasswordChangedLetter } from '$lib/server/auth-mail';
import { hasFieldErrors, validateNewPassword } from '$lib/auth-fields';
import { countActiveLoans } from '$lib/server/library';
import { requestPasswordReset } from '$lib/server/password-reset';

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
		activeCount: await countActiveLoans(locals.user.id),
		admin: canOpenDesk(locals.user)
	};
};

export const actions: Actions = {
	password: async (event) => {
		if (!event.locals.user) {
			redirect(302, '/login');
		}

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

		const mailed = await sendPasswordChangedLetter({
			to: event.locals.user.email,
			name: event.locals.user.name,
			profileHref: `${event.url.origin}/profile`
		});

		return {
			ok: true,
			message: mailed.ok
				? `Heslo je nové. Potvrdenie ide na ${event.locals.user.email}.`
				: 'Heslo je nové. Potvrdenie na poštu teraz neodišlo — skontroluj Mailtrap alebo Mailgun.'
		};
	},

	recover: async (event) => {
		if (!event.locals.user) {
			redirect(302, '/login');
		}

		if (!event.locals.supabase) {
			return fail(503, {
				message: 'Obnova hesla nie je nastavená. Chýba Supabase v .env.'
			});
		}

		const result = await requestPasswordReset({
			email: event.locals.user.email,
			name: event.locals.user.name,
			origin: event.url.origin,
			supabase: event.locals.supabase,
			mustExist: true
		});

		if (!result.ok) {
			return fail(400, { message: result.message });
		}

		if (!result.mailed) {
			return fail(400, {
				message:
					result.via === 'pult'
						? 'Odkaz sa pripravil, ale list neodišiel. Skontroluj Mailtrap alebo Mailgun v .env.'
						: 'Odkaz na obnovu sa teraz nepodarilo poslať.'
			});
		}

		return {
			ok: true,
			message: `Odkaz na nové heslo ide na ${event.locals.user.email}.`
		};
	}
};
