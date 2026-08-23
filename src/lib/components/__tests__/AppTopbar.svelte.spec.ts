import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { CategoryChip, SignedReader } from '$lib/types';
import AppTopbar from '../AppTopbar.svelte';
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

vi.mock('mode-watcher', () => ({
	toggleMode: vi.fn(),
	mode: { current: 'light' }
}));

const categories: CategoryChip[] = [
	{ id: '1', name: 'Strojárstvo', slug: 'strojarstvo', code: 'STR', accent: '#3d2a1c', bookCount: 4 }
];

const user: SignedReader = {
	id: 'user-509a',
	name: 'Peter Dinis',
	email: 'peter@spst.sk'
};

afterEach(() => {
	document.getElementById('logout-form')?.remove();
});

describe('account pass menu', () => {
	it('opens a full-width pass for a signed-in reader', async () => {
		render(AppTopbar, { user, categories });

		await page.getByRole('button', { name: 'Peter Dinis' }).click();

		await expect.element(page.getByText('preukaz 509A')).toBeVisible();
		await expect.element(page.getByRole('menuitem', { name: 'Moje knihy' })).toBeVisible();
		await expect.element(page.getByRole('menuitem', { name: 'Odhlásiť' })).toBeVisible();

		const trigger = document.querySelector('.account-mark');
		const menu = document.querySelector('.account-pass');
		expect(menu).toBeTruthy();
		expect(menu?.classList.contains('account-pass')).toBe(true);
		expect(menu?.getBoundingClientRect().width ?? 0).toBeGreaterThan(
			(trigger?.getBoundingClientRect().width ?? 40) * 2
		);
	});

	it('submits logout through the hidden desk form', async () => {
		const form = document.createElement('form');
		form.id = 'logout-form';
		document.body.append(form);
		const submitted = vi.fn((event: Event) => event.preventDefault());
		form.addEventListener('submit', submitted);

		render(AppTopbar, { user, categories });
		await page.getByRole('button', { name: 'Peter Dinis' }).click();
		await page.getByRole('menuitem', { name: 'Odhlásiť' }).click();

		expect(submitted).toHaveBeenCalledTimes(1);
	});

	it('offers sign-in for a guest and keeps the pass readable', async () => {
		render(AppTopbar, { user: null, categories });

		await page.getByRole('button', { name: 'Hosť' }).click();

		await expect.element(page.getByText('hosť v sieni')).toBeVisible();
		await expect.element(page.getByRole('menuitem', { name: 'Prihlásiť sa' })).toBeVisible();
		await expect.element(page.getByRole('menuitem', { name: 'Moje knihy' })).not.toBeInTheDocument();
	});
});
