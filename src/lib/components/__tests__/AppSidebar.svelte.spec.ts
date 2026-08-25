import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { SignedReader } from '$lib/types';
import AppSidebar from '../AppSidebar.svelte';
import '../../../routes/layout.css';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/loans'),
		params: {},
		route: { id: '/loans' },
		data: {},
		form: null,
		error: null,
		status: 200,
		state: {}
	}
}));

vi.mock('$app/paths', () => ({
	base: '',
	assets: '',
	resolve: (route: string) => route
}));

const user: SignedReader = {
	id: 'user-509a',
	name: 'Peter Dinis',
	email: 'peter@spst.sk',
	role: 'reader'
};

afterEach(() => {
	document.getElementById('logout-form')?.remove();
});

describe('AppSidebar', () => {
	it('lists the hall drawers and the profile pass', async () => {
		render(AppSidebar, { user });

		await expect.element(page.getByRole('link', { name: 'Katalóg' })).toHaveAttribute('href', '/books');
		await expect.element(page.getByRole('link', { name: 'Môj profil' })).toHaveAttribute('href', '/profile');
		await expect.element(page.getByRole('button', { name: 'Odhlásiť' })).toBeVisible();
	});

	it('offers login when the pass is empty', async () => {
		render(AppSidebar, { user: null });

		await expect.element(page.getByRole('link', { name: 'Prihlásiť sa' })).toHaveAttribute('href', '/login');
	});
});
