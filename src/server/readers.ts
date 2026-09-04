import { eq } from 'drizzle-orm';
import { parseRole, type Role } from '@/auth/ability';
import { isAdminEmail } from '@/server/admin-access';
import { db } from '@/server/db';
import { user } from '@/server/db/schema';
import type { SignedReader } from '@/types';

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

function pass(id: string, name: string, email: string, role: Role, className = ''): SignedReader {
	return { id, name, email, role, className };
}

function resolvedRole(email: string, stored: unknown, fromMeta: unknown): Role {
	if (isAdminEmail(email) || fromMeta === 'librarian') return 'librarian';
	return parseRole(stored);
}

export async function ensureLocalReader(input: {
	id: string;
	email: string;
	name: string;
	role?: unknown;
}): Promise<SignedReader | null> {
	const email = input.email.trim().toLowerCase();
	if (!email) return null;

	const name = displayName(input.name, email);
	const existing =
		(await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.then((rows) => rows[0])) ??
		(await db
			.select()
			.from(user)
			.where(eq(user.id, input.id))
			.then((rows) => rows[0]));

	if (existing) {
		const role = resolvedRole(email, existing.role, input.role);
		if (
			existing.name !== name ||
			existing.email !== email ||
			!existing.emailVerified ||
			parseRole(existing.role) !== role
		) {
			await db
				.update(user)
				.set({ name, email, emailVerified: true, role, updatedAt: new Date() })
				.where(eq(user.id, existing.id));
		}

		return pass(existing.id, name, email, role, existing.className ?? '');
	}

	const role = resolvedRole(email, 'reader', input.role);
	await db.insert(user).values({
		id: input.id,
		name,
		email,
		emailVerified: true,
		role
	});

	return pass(input.id, name, email, role, '');
}

export async function readerFromClaims(claims: {
	sub?: string;
	email?: string;
	user_metadata?: unknown;
}): Promise<SignedReader | null> {
	if (!claims.sub) return null;

	return await ensureLocalReader({
		id: claims.sub,
		email: claims.email ?? '',
		name: String(metaValue(claims.user_metadata, 'name') ?? ''),
		role: metaValue(claims.user_metadata, 'role')
	});
}
