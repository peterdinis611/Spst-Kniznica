import { error, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { defineAbilityFor } from '$lib/ability';
import type { SignedReader } from '$lib/types';

export function isAdminEmail(email: string | null | undefined, allowList = env.ADMIN_EMAILS) {
	if (!email) return false;
	const needle = email.trim().toLowerCase();
	if (!needle) return false;

	const list = (allowList ?? '')
		.split(',')
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean);

	if (list.includes('*')) return true;
	return list.includes(needle);
}

export function canOpenDesk(user: SignedReader | null | undefined, isDev = dev) {
	if (!user) return false;
	if (defineAbilityFor(user.role).can('manage', 'Desk')) return true;
	return isDev;
}

export function deskGate(pathname: string, user: SignedReader | undefined) {
	if (!pathname.startsWith('/admin')) return 'ok' as const;
	if (!user) return 'login' as const;
	if (!canOpenDesk(user)) return 'forbidden' as const;
	return 'ok' as const;
}

export function requireAdmin(user: SignedReader | undefined) {
	if (!user) redirect(302, '/login');
	if (!canOpenDesk(user)) {
		error(403, { message: 'Pult je len pre správu fondu.' });
	}
	return user;
}
