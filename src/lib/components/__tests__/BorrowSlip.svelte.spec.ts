import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BorrowSlip from '../BorrowSlip.svelte';

vi.mock('$app/forms', () => ({
	enhance: () => ({ destroy() {} })
}));

describe('BorrowSlip', () => {
	it('opens a checkout slip with name, class, and duration', async () => {
		render(BorrowSlip, {
			title: 'Technické kreslenie',
			defaults: { firstName: 'Peter', lastName: 'Dinis', className: 'II.A', days: 21 },
			open: true
		});

		await expect.element(page.getByRole('heading', { name: 'Vyplň lístok.' })).toBeVisible();
		await expect.element(page.getByText('Technické kreslenie')).toBeVisible();
		await expect.element(page.getByLabelText('Meno')).toHaveValue('Peter');
		await expect.element(page.getByLabelText('Priezvisko')).toHaveValue('Dinis');
		await expect.element(page.getByLabelText('Trieda')).toHaveValue('II.A');
		await expect.element(page.getByRole('button', { name: '21 dní' })).toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByLabelText('Iná')).toHaveValue(21);
		await expect.element(page.getByRole('button', { name: 'Vypožičať' })).toBeVisible();
	});

	it('lets a reader type a custom period', async () => {
		render(BorrowSlip, {
			title: 'Technické kreslenie',
			defaults: { firstName: 'Peter', lastName: 'Dinis', className: 'II.A', days: 21 },
			open: true
		});

		await page.getByRole('button', { name: '14 dní' }).click();
		await expect.element(page.getByRole('button', { name: '14 dní' })).toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByLabelText('Iná')).toHaveValue(14);

		const custom = page.getByLabelText('Iná');
		await custom.fill('40');
		await expect.element(custom).toHaveValue(40);
		await expect.element(page.getByRole('button', { name: '14 dní' })).toHaveAttribute('aria-pressed', 'false');
	});
});
