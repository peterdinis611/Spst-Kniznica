import { error, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
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
