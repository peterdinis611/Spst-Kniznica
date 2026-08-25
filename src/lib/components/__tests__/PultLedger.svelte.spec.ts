import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PultLedger from '../PultLedger.svelte';
import type { PultColumn } from '$lib/pult-ledger';
import '../../../routes/admin.css';

type Slip = { id: string; name: string; slug: string; count: number };

const columns: PultColumn<Slip>[] = [
	{
		id: 'name',
		accessorKey: 'name',
		header: 'Odbor',
		cell: (info) => ({ title: info.row.original.name, hint: info.row.original.slug })
	},
	{ id: 'count', accessorKey: 'count', header: 'Knihy' }
];

describe('PultLedger', () => {
	it('renders a stacked slip and sorts from the header', async () => {
		const rows: Slip[] = [
			{ id: 'str', name: 'Stroje', slug: 'stroje', count: 12 },
			{ id: 'inf', name: 'Informatika', slug: 'informatika', count: 3 }
		];
		render(PultLedger, { rows, columns: columns as never, empty: 'prázdne' });

		await expect.element(page.getByText('Stroje', { exact: true })).toBeVisible();
		await expect.element(page.getByText('stroje', { exact: true })).toBeVisible();
		await expect.element(page.getByRole('grid', { name: 'Register zásuvky' })).toBeVisible();

		await page.getByRole('button', { name: /Odbor/ }).click();
		const first = document.querySelector('.pult-ledger-row strong');
		expect(first?.textContent).toBe('Informatika');
	});

	it('virtualizes a dense drawer', async () => {
		const rows: Slip[] = Array.from({ length: 40 }, (_, i) => ({
			id: `row-${i}`,
			name: `Lístok ${String(i).padStart(2, '0')}`,
			slug: `listok-${i}`,
			count: i
		}));
		render(PultLedger, { rows, columns: columns as never });

		await expect.element(page.getByText(/virtuálny register/)).toBeVisible();
		expect(document.querySelectorAll('.pult-ledger-row').length).toBeLessThan(40);
		await expect.element(page.getByText('Lístok 00')).toBeVisible();
	});
});
