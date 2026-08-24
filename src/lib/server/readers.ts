import { eq } from 'drizzle-orm';
import { parseRole, type Role } from '$lib/ability';
import { isAdminEmail } from '$lib/server/admin-access';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import type { SignedReader } from '$lib/types';

function displayName(name: string, email: string) {
	const trimmed = name.trim();
	if (trimmed.length >= 2) return trimmed;
	const local = email.split('@')[0]?.trim() ?? '';
	return local.length >= 2 ? local : 'Čitateľ';
}

function metaValue(meta: unknown, key: string): unknown {
	if (meta && typeof meta === 'object' && meta !== null && key in meta) {
		return (meta as Record<string, unknown>)[key];
	}
	return undefined;
}

function pass(id: string, name: string, email: string, role: Role): SignedReader {
	return { id, name, email, role };
}

function resolvedRole(email: string, stored: unknown, fromMeta: unknown): Role {
	if (isAdminEmail(email) || fromMeta === 'librarian') return 'librarian';
	return parseRole(stored);
}

export function ensureLocalReader(input: {
	id: string;
	email: string;
	name: string;
	role?: unknown;
}): SignedReader | null {
	const email = input.email.trim().toLowerCase();
	if (!email) return null;

	const name = displayName(input.name, email);
	const existing =
		db.select().from(user).where(eq(user.email, email)).get() ??
		db.select().from(user).where(eq(user.id, input.id)).get();

	if (existing) {
		const role = resolvedRole(email, existing.role, input.role);
		if (
			existing.name !== name ||
			existing.email !== email ||
			!existing.emailVerified ||
			parseRole(existing.role) !== role
		) {
			db.update(user)
				.set({ name, email, emailVerified: true, role, updatedAt: new Date() })
				.where(eq(user.id, existing.id))
				.run();
		}

		return pass(existing.id, name, email, role);
	}

	const role = resolvedRole(email, 'reader', input.role);
	db.insert(user)
		.values({
			id: input.id,
			name,
			email,
			emailVerified: true,
			role
		})
		.run();

	return pass(input.id, name, email, role);
}

export function readerFromClaims(claims: {
	sub?: string;
	email?: string;
	user_metadata?: unknown;
}): SignedReader | null {
	if (!claims.sub) return null;

	return ensureLocalReader({
		id: claims.sub,
		email: claims.email ?? '',
		name: String(metaValue(claims.user_metadata, 'name') ?? ''),
		role: metaValue(claims.user_metadata, 'role')
	});
}
