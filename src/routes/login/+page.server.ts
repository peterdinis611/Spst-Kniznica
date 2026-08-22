import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, '/loans');
	}

	return {
		mode: url.searchParams.get('mod') === 'novy' ? 'novy' : 'vstup'
	};
};

export const actions: Actions = {
	signIn: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		try {
			await auth.api.signInEmail({
				body: { email, password },
				headers: event.request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Prihlásenie zlyhalo.', mode: 'vstup' });
			}
			return fail(500, { message: 'Nečakaná chyba.', mode: 'vstup' });
		}

		redirect(302, '/loans');
	},
	signUp: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const name = formData.get('name')?.toString() ?? '';

		if (name.trim().length < 2) {
			return fail(400, { message: 'Meno na preukaze musí mať aspoň dve písmená.', mode: 'novy' });
		}

		try {
			await auth.api.signUpEmail({
				body: { email, password, name },
				headers: event.request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Registrácia zlyhala.', mode: 'novy' });
			}
			return fail(500, { message: 'Nečakaná chyba.', mode: 'novy' });
		}

		redirect(302, '/loans');
	}
};
