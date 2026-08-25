import { createServerClient } from '@supabase/ssr';
import { canOpenDesk } from '$lib/server/admin-access';
import { ensureLocalReader, readerFromClaims } from '$lib/server/readers';
import { supabasePublic } from '$lib/supabase/config';
import type { SignedReader } from '$lib/types';

export function cookiesFromHeader(header: string | null) {
	if (!header) return [];
	return header.split(';').flatMap((part) => {
		const trimmed = part.trim();
		if (!trimmed) return [];
		const eq = trimmed.indexOf('=');
		if (eq < 0) return [{ name: trimmed, value: '' }];
		const name = trimmed.slice(0, eq);
		const raw = trimmed.slice(eq + 1);
		let value = raw;
		try {
			value = decodeURIComponent(raw);
		} catch {
			value = raw;
		}
		return [{ name, value }];
	});
}

export async function readerFromRequest(req: Request): Promise<SignedReader | undefined> {
	const { url, key, configured } = supabasePublic();
	if (!configured) return undefined;

	const bag = cookiesFromHeader(req.headers.get('cookie'));
	const supabase = createServerClient(url, key, {
		cookies: {
			getAll: () => bag,
			setAll: () => {}
		}
	});

	try {
		const { data } = await supabase.auth.getClaims();
		if (!data?.claims) return undefined;

		const fromClaims = readerFromClaims(data.claims);
		if (fromClaims) return fromClaims;

		if (!data.claims.sub) return undefined;
		const { data: userData } = await supabase.auth.getUser();
		if (!userData.user) return undefined;

		return (
			ensureLocalReader({
				id: userData.user.id,
				email: userData.user.email ?? '',
				name: String(userData.user.user_metadata?.name ?? ''),
				role: userData.user.user_metadata?.role
			}) ?? undefined
		);
	} catch {
		return undefined;
	}
}

export async function deskUploader(req: Request): Promise<SignedReader | null> {
	const reader = await readerFromRequest(req);
	if (!reader || !canOpenDesk(reader)) return null;
	return reader;
}
