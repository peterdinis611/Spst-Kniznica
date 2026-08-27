import { db } from '../db';
import { uniqueConstraintMessage } from '../admin';
import { slugify } from '$lib/admin';

export type DeskResult = { ok: true } | { ok: false; message: string };

export type DeskTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function fail(message: string): DeskResult {
	return { ok: false, message };
}

export function ok(): DeskResult {
	return { ok: true };
}

export function needle(query: string) {
	return `%${query.trim()}%`;
}

export function newId(prefix: string, label: string) {
	const slug = slugify(label);
	const token = crypto.randomUUID().slice(0, 6);
	return `${prefix}-${slug || 'zaznam'}-${token}`;
}

export function caught(cause: unknown, unique: string): DeskResult {
	return fail(uniqueConstraintMessage(cause, unique) ?? 'Záznam sa neuložil.');
}
