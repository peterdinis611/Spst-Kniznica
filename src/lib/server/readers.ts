import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import type { SignedReader } from '$lib/types';

function displayName(name: string, email: string) {
	const trimmed = name.trim();
	if (trimmed.length >= 2) return trimmed;
	const local = email.split('@')[0]?.trim() ?? '';
	return local.length >= 2 ? local : 'Čitateľ';
}

export function ensureLocalReader(input: { id: string; email: string; name: string }): SignedReader | null {
	const email = input.email.trim().toLowerCase();
	if (!email) return null;

	const name = displayName(input.name, email);
	const existing =
		db.select().from(user).where(eq(user.email, email)).get() ??
		db.select().from(user).where(eq(user.id, input.id)).get();

	if (existing) {
		if (existing.name !== name || existing.email !== email || !existing.emailVerified) {
			db.update(user)
				.set({ name, email, emailVerified: true, updatedAt: new Date() })
				.where(eq(user.id, existing.id))
				.run();
		}

		return { id: existing.id, name, email };
	}

	db.insert(user)
		.values({
			id: input.id,
			name,
			email,
			emailVerified: true
		})
		.run();

	return { id: input.id, name, email };
}

export function readerFromClaims(claims: {
	sub?: string;
	email?: string;
	user_metadata?: unknown;
}): SignedReader | null {
	if (!claims.sub) return null;

	const meta = claims.user_metadata;
	const metaName =
		meta && typeof meta === 'object' && meta !== null && 'name' in meta
			? String((meta as { name?: unknown }).name ?? '')
			: '';

	return ensureLocalReader({
		id: claims.sub,
		email: claims.email ?? '',
		name: metaName
	});
}
