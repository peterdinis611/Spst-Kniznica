import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LoginPage from '../+page.svelte';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/login'),
		params: {},
		route: { id: '/login' },
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

describe('login pass', () => {
	it('hides field errors after a successful registration letter', async () => {
		render(LoginPage, {
			data: { mode: 'novy', configured: true },
			form: {
				ok: true,
				mode: 'novy',
				message: 'Skontroluj e-mail a potvrď účet. Potom sa môžeš prihlásiť.',
				values: { name: 'Peter Dinis', email: 'peter@spst.sk' }
			}
		} as never);

		await expect.element(page.getByText('Skontroluj e-mail a potvrď účet. Potom sa môžeš prihlásiť.')).toBeVisible();
		await expect.element(page.getByRole('link', { name: 'Späť na prihlásenie' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Vytvoriť preukaz' })).not.toBeInTheDocument();
		await expect.element(page.getByLabelText('Heslo')).not.toBeInTheDocument();
		await expect.element(page.getByText('Zadaj heslo.')).not.toBeInTheDocument();
	});

	it('prints a field error on a thin login', async () => {
		render(LoginPage, {
			data: { mode: 'vstup', configured: true },
			form: {
				errors: { email: 'Zadaj e-mail.', password: 'Zadaj heslo.' },
				values: { email: '' },
				mode: 'vstup'
			}
		} as never);

		await expect.element(page.getByText('Zadaj e-mail.')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Prihlásiť sa' })).toBeVisible();
	});
});
