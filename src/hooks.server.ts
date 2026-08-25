import { error, redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { createServerClient } from '@supabase/ssr';
import { defineAbilityFor } from '$lib/ability';
import { canOpenDesk } from '$lib/server/admin-access';
import { ensureSeeded } from '$lib/server/db/seed';
import { warmCatalog } from '$lib/server/library';
import { ensureLocalReader, readerFromClaims } from '$lib/server/readers';
import { supabasePublic } from '$lib/supabase/config';

const aliases = [
	['/vsetky-knihy', '/holdings'],
	['/knihy', '/books'],
	['/odbory', '/departments'],
	['/autori', '/authors'],
	['/vypozicky', '/loans'],
	['/preukaz', '/profile'],
	['/profil', '/profile'],
	['/prihlasenie', '/login'],
	['/registracia', '/login?mod=novy'],
	['/zabudnute-heslo', '/login/recovery'],
	['/nove-heslo', '/login/password'],
	['/login/obnova', '/login/recovery'],
	['/login/heslo', '/login/password'],
	['/odhlasenie', '/logout'],
	['/pult', '/admin'],
	['/admin/odbory', '/admin/departments'],
	['/admin/autori', '/admin/authors'],
	['/admin/knihy', '/admin/books'],
	['/admin/vazby', '/admin/book-authors'],
	['/admin/vytlacky', '/admin/holdings'],
	['/admin/vypozicky', '/admin/loans'],
	['/admin/rezervacie', '/admin/reservations'],
	['/admin/citately', '/admin/readers']
] as const;

const handleAliases: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	for (const [from, to] of aliases) {
		if (path === from || path.startsWith(`${from}/`)) {
			const dest = to.includes('?') ? to : `${to}${path.slice(from.length)}${event.url.search}`;
			redirect(308, dest);
		}
	}
	return resolve(event);
};

const handleCatalog: Handle = async ({ event, resolve }) => {
	if (!building) {
		try {
			ensureSeeded();
			warmCatalog();
		} catch {
			// Tables may not exist until `bun run db:migrate`.
		}
	}

	return resolve(event);
};

const handleSupabase: Handle = async ({ event, resolve }) => {
	const { url, key, configured } = supabasePublic();

	if (!configured) {
		return resolve(event);
	}

	event.locals.supabase = createServerClient(url, key, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet, headers) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
				try {
					if (headers && Object.keys(headers).length > 0) {
						event.setHeaders(headers);
					}
				} catch {
					// Form actions cannot set HTTP headers; the auth cookies still persist.
				}
			}
		}
	});

	try {
		const { data } = await event.locals.supabase.auth.getClaims();
		if (data?.claims) {
			event.locals.user = readerFromClaims(data.claims) ?? undefined;
			if (!event.locals.user && data.claims.sub) {
				const { data: userData } = await event.locals.supabase.auth.getUser();
				if (userData.user) {
					event.locals.user =
						ensureLocalReader({
							id: userData.user.id,
							email: userData.user.email ?? '',
							name: String(userData.user.user_metadata?.name ?? ''),
							role: userData.user.user_metadata?.role
						}) ?? undefined;
				}
			}
		}
	} catch {
		// Catalog pages still work if Auth is unreachable.
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const handleAbility: Handle = async ({ event, resolve }) => {
	event.locals.ability = defineAbilityFor(event.locals.user?.role);
	return resolve(event);
};

const handleAdmin: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/admin')) {
		if (!event.locals.user) redirect(302, '/login');
		if (!canOpenDesk(event.locals.user)) {
			error(403, { message: 'Pult je len pre správu fondu.' });
		}
	}

	return resolve(event);
};

export const handle: Handle = sequence(
	handleAliases,
	handleCatalog,
	handleSupabase,
	handleAbility,
	handleAdmin
);

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
