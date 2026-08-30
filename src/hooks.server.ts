import { error, redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { createServerClient } from '@supabase/ssr';
import { defineAbilityFor } from '$lib/ability';
import { aliasTarget } from '$lib/route-aliases';
import { deskGate } from '$lib/server/admin-access';
import { ensureSeeded } from '$lib/server/db/seed';
import { warmCatalog } from '$lib/server/library';
import { runDeskTick } from '$lib/server/desk-tick';
import { publicErrorMessage } from '$lib/server/public-error';
import { ensureLocalReader, readerFromClaims } from '$lib/server/readers';
import { supabasePublic } from '$lib/supabase/config';

const handleAliases: Handle = async ({ event, resolve }) => {
	const dest = aliasTarget(event.url.pathname, event.url.search);
	if (dest) redirect(308, dest);
	return resolve(event);
};

let lastTick = 0;
const TICK_EVERY_MS = 30 * 60 * 1000;

const handleCatalog: Handle = async ({ event, resolve }) => {
	if (!building) {
		try {
			await ensureSeeded();
			await warmCatalog();
		} catch {
			// Tables may not exist until `bun run db:migrate`.
		}

		if (
			!import.meta.env.VITEST &&
			!event.url.pathname.startsWith('/api/desk/tick') &&
			Date.now() - lastTick >= TICK_EVERY_MS
		) {
			lastTick = Date.now();
			void runDeskTick().catch(() => {
				lastTick = 0;
			});
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
			event.locals.user = (await readerFromClaims(data.claims)) ?? undefined;
			if (!event.locals.user && data.claims.sub) {
				const { data: userData } = await event.locals.supabase.auth.getUser();
				if (userData.user) {
					event.locals.user =
						(await ensureLocalReader({
							id: userData.user.id,
							email: userData.user.email ?? '',
							name: String(userData.user.user_metadata?.name ?? ''),
							role: userData.user.user_metadata?.role
						})) ?? undefined;
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
	const gate = deskGate(event.url.pathname, event.locals.user);
	if (gate === 'login') redirect(302, '/login');
	if (gate === 'forbidden') {
		error(403, { message: 'Pult je len pre správu fondu.' });
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
	return { message: publicErrorMessage(error, status) };
};
