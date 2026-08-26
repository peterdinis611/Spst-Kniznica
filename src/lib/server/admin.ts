import { invalidateCatalogCache } from './catalog-cache';
import { deleteBookFts, rebuildCatalogFts, upsertBookFts } from './db/catalog-fts';

export { canOpenDesk, isAdminEmail, requireAdmin } from './admin-access';

export async function refreshCatalog(
	scope: 'all' | { bookId: string } | { deletedBookId: string } = 'all'
) {
	invalidateCatalogCache();
	if (scope === 'all') {
		await rebuildCatalogFts();
		return;
	}
	if ('bookId' in scope) {
		await upsertBookFts(scope.bookId);
		return;
	}
	await deleteBookFts(scope.deletedBookId);
}

export function formText(data: FormData, name: string) {
	return data.get(name)?.toString().trim() ?? '';
}

export function formInt(data: FormData, name: string) {
	const raw = formText(data, name);
	if (!raw) return null;
	const value = Number(raw);
	return Number.isInteger(value) ? value : null;
}

export function formBool(data: FormData, name: string) {
	const raw = data.get(name)?.toString();
	return raw === '1' || raw === 'on' || raw === 'true';
}

export function formDate(data: FormData, name: string) {
	const raw = formText(data, name);
	if (!raw) return null;
	const value = new Date(raw);
	return Number.isNaN(value.getTime()) ? null : value;
}

export function uniqueConstraintMessage(cause: unknown, fallback: string) {
	const code =
		cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : '';
	const text = cause instanceof Error ? cause.message : String(cause);
	if (code === '23505' || /UNIQUE|unique/i.test(text)) return fallback;
	return null;
}
