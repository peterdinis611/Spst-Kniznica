import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { ensureSeeded } from '$lib/server/db/seed';

const aliases = [
	['/knihy', '/books'],
	['/odbory', '/departments'],
	['/autori', '/authors'],
	['/vypozicky', '/loans'],
	['/prihlasenie', '/login'],
	['/odhlasenie', '/logout']
] as const;

const handleAliases: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	for (const [from, to] of aliases) {
		if (path === from || path.startsWith(`${from}/`)) {
			redirect(308, `${to}${path.slice(from.length)}${event.url.search}`);
		}
	}
	return resolve(event);
};

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

export const handle: Handle = sequence(handleAliases, handleBetterAuth);

export const handleError: HandleServerError = ({ error, status }) => {
	const raw = error instanceof Error ? error.message : String(error);
	const internal = /ENOENT|EACCES|EPERM|\.svelte-kit|node_modules|\/Users\/|\/home\/|\\\\/.test(raw);

	if (status === 404) {
		return { message: 'Túto stránku sme v katalógu nenašli.' };
	}

	if (internal || status >= 500) {
		return { message: 'Fond túto kartu teraz neotvorí.' };
	}

	return { message: raw };
};
