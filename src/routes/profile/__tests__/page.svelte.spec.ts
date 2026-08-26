import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ProfilePage from '../+page.svelte';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/profile'),
		params: {},
		route: { id: '/profile' },
		data: {},
		form: null,
		error: null,
		status: 200,
		state: {}
	}
}));

vi.mock('$app/forms', () => ({
	enhance: () => ({ destroy() {} })
}));

vi.mock('$app/paths', () => ({
	base: '',
	assets: '',
	resolve: (route: string) => route
}));

const data = {
	reader: {
		id: 'user-509a',
		name: 'Peter Dinis',
		email: 'peter@spst.sk',
		role: 'reader' as const
	},
	activeCount: 2,
	admin: false
};

describe('profile pass', () => {
	it('prints the reader slip and a password request', async () => {
		render(ProfilePage, { data, form: null } as never);

		await expect.element(page.getByText('Peter Dinis')).toBeVisible();
		await expect.element(page.getByText('peter@spst.sk')).toBeVisible();
		await expect.element(page.getByText('509A', { exact: true })).toBeVisible();
		await expect.element(page.getByRole('link', { name: 'Moje knihy' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Uložiť heslo' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Poslať odkaz e-mailom' })).toBeVisible();
		await expect.element(page.getByRole('link', { name: 'Pult' })).not.toBeInTheDocument();
	});

	it('offers the desk to an admin reader', async () => {
		render(ProfilePage, { data: { ...data, admin: true }, form: null } as never);

		await expect.element(page.getByRole('link', { name: 'Pult' })).toBeVisible();
	});
});
