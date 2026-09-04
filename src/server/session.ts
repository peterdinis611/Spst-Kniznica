import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { canOpenDesk } from '@/server/admin-access';
import { listCategoryChips } from '@/server/library';
import { ensureLocalReader, readerFromClaims } from '@/server/readers';
import { supabasePublic } from '@/config/supabase';
import type { RequestEvent } from '@/http/kit';
import type { SignedReader } from '@/types';

export async function createSupabaseServer() {
	const { url, key, configured } = supabasePublic();
	if (!configured) return null;
	const jar = await cookies();
	return createServerClient(url, key, {
		cookies: {
			getAll: () => jar.getAll(),
			setAll: (list) => {
				try {
					list.forEach(({ name, value, options }) => {
						jar.set(name, value, options);
					});
				} catch {
					// Server components cannot always write cookies.
				}
			}
		}
	});
}

export async function getSessionReader(): Promise<SignedReader | null> {
	const supabase = await createSupabaseServer();
	if (!supabase) return null;
	try {
		const { data } = await supabase.auth.getClaims();
		if (!data?.claims) return null;
		const fromClaims = await readerFromClaims(data.claims);
		if (fromClaims) return fromClaims;
		if (!data.claims.sub) return null;
		const { data: userData } = await supabase.auth.getUser();
		if (!userData.user) return null;
		return (
			(await ensureLocalReader({
				id: userData.user.id,
				email: userData.user.email ?? '',
				name: String(userData.user.user_metadata?.name ?? ''),
				role: userData.user.user_metadata?.role
			})) ?? null
		);
	} catch {
		return null;
	}
}

export async function layoutChrome(pathname: string) {
	const user = await getSessionReader();
	const admin = canOpenDesk(user);
	const skip =
		pathname === '/' ||
		pathname.startsWith('/docs') ||
		pathname.startsWith('/login') ||
		pathname.startsWith('/auth');
	let categories: Awaited<ReturnType<typeof listCategoryChips>> = [];
	if (!skip) {
		try {
			categories = await listCategoryChips();
		} catch {
			categories = [];
		}
	}

	return {
		user: user
			? {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					className: user.className
				}
			: null,
		admin,
		categories
	};
}

export async function actionEvent(): Promise<RequestEvent> {
	const h = await headers();
	const ip =
		h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		h.get('x-real-ip') ||
		h.get('cf-connecting-ip') ||
		'0.0.0.0';
	return {
		getClientAddress: () => ip,
		request: new Request('http://localhost/action', {
			method: 'POST',
			headers: { 'user-agent': h.get('user-agent') ?? '' }
		})
	};
}
