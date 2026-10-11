import { db } from '../db';
import { uniqueConstraintMessage } from '../admin';
import { slugify } from '@/desk/admin';

export type DeskResult = { ok: true } | { ok: false; message: string };

export type DeskTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function fail(message: string): DeskResult {
	return { ok: false, message };
}

export function ok(): DeskResult {
	return { ok: true };
}

/** Blocks copper-drawer writes unless the session can manage the desk. Skipped under Vitest. */
export async function assertOperateDesk(): Promise<{ ok: false; message: string } | null> {
	if (process.env.VITEST) return null;
	const { getSessionReader } = await import('../session');
	const { canOperateDesk } = await import('../admin-access');
	const user = await getSessionReader();
	if (!canOperateDesk(user)) return { ok: false, message: 'Pult je len pre správu fondu.' };
	return null;
}

export async function requireOperateDesk(): Promise<void> {
	const denied = await assertOperateDesk();
	if (denied) throw new Error(denied.message);
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
