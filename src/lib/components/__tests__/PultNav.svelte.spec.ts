import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PultNav from '../PultNav.svelte';
import '../../../routes/admin.css';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/admin/departments'),
		params: {},
		route: { id: '/admin/departments' },
		data: {},
		form: null,
		error: null,
		status: 200,
		state: {}
	}
}));

describe('PultNav', () => {
	it('marks the open drawer and lists every table', async () => {
		render(PultNav);

		const nav = page.getByRole('navigation', { name: 'Kartotéka pultu' });
		await expect.element(nav).toBeVisible();
		await expect.element(page.getByRole('link', { name: /Odbory/ })).toHaveAttribute('href', '/admin/departments');
		await expect.element(page.getByRole('link', { name: /Knihy/ })).toHaveAttribute('href', '/admin/books');

		const current = document.querySelector('a.pult-tab.is-on');
		expect(current?.textContent).toMatch(/Odbory/);
	});
});
