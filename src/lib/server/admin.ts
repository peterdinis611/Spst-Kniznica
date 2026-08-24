import { error, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { invalidateCatalogCache } from './catalog-cache';
import { deleteBookFts, rebuildCatalogFts, upsertBookFts } from './db/catalog-fts';
import type { SignedReader } from '$lib/types';

export function isAdminEmail(
	email: string | null | undefined,
	allowList = env.ADMIN_EMAILS,
	isDev = dev
) {
	if (!email) return false;
	const needle = email.trim().toLowerCase();
	if (!needle) return false;

	const list = (allowList ?? '')
		.split(',')
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean);

	if (list.includes('*')) return true;
	if (list.includes(needle)) return true;
	if (list.length === 0 && isDev) return true;
	return false;
}

export function requireAdmin(user: SignedReader | undefined) {
	if (!user) redirect(302, '/login');
	if (!isAdminEmail(user.email)) {
		error(403, { message: 'Pult je len pre správu fondu.' });
	}
	return user;
}

export function refreshCatalog(scope: 'all' | { bookId: string } | { deletedBookId: string } = 'all') {
	invalidateCatalogCache();
	if (scope === 'all') {
		rebuildCatalogFts();
		return;
	}
	if ('bookId' in scope) {
		upsertBookFts(scope.bookId);
		return;
	}
	deleteBookFts(scope.deletedBookId);
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
	const text = cause instanceof Error ? cause.message : String(cause);
	if (/UNIQUE|unique/i.test(text)) return fallback;
	return null;
}
