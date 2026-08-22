import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { ensureSeeded } from '$lib/server/db/seed';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	if (!building) {
		try {
			ensureSeeded();
		} catch {
			// Tables may not exist until drizzle push; pages will surface the error.
		}
	}

	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
