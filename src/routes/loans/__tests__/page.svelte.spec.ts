import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { BookSlip, LoanRecord } from '$lib/types';
import LoansPage from '../+page.svelte';

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

vi.mock('$app/forms', () => ({
	enhance: () => ({ destroy() {} })
}));

vi.mock('$app/paths', () => ({
	base: '',
	assets: '',
	resolve: (route: string, params?: Record<string, string>) =>
		route.replace(/\[([^\]]+)\]/g, (_, key) => params?.[key] ?? _)
}));

const reader = { id: 'user-509a', name: 'Peter Dinis', email: 'peter@spst.sk', role: 'reader' as const };

const book = (title: string, id = title): BookSlip => ({
	id,
	title,
	callNumber: 'STR 12',
	copiesTotal: 2,
	copiesAvailable: 1,
	category: {
		id: 'cat-str',
		name: 'Strojárstvo',
		slug: 'strojarstvo',
		code: 'STR',
		accent: '#3d2a1c'
	},
	authors: [{ id: 'a1', name: 'Ján Test', slug: 'jan-test', position: 0 }]
});

function record(
	title: string,
	opts: { id?: string; returnedAt?: Date | null; dueAt?: Date } = {}
): LoanRecord {
	return {
		id: opts.id ?? title,
		borrowedAt: new Date(2026, 7, 1),
		dueAt: opts.dueAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
		returnedAt: opts.returnedAt ?? null,
		borrowerFirstName: 'Peter',
		borrowerLastName: 'Dinis',
		borrowerClass: 'II.A',
		loanDays: 21,
		book: book(title)
	};
}

const empty = {
	user: reader,
	admin: false,
	categories: [] as { id: string; name: string; slug: string; code: string; accent: string; bookCount: number }[],
	reader,
	loans: [] as LoanRecord[],
	history: [] as LoanRecord[],
	activeCount: 0,
	maxLoans: null
};

describe('Moje knihy folio', () => {
	it('prints the reader pass and an empty borrowed slip', async () => {
		render(LoansPage, { data: empty, form: null } as never);

		await expect.element(page.getByRole('heading', { name: 'Peter Dinis' })).toBeVisible();
		await expect.element(page.getByText(/preukaz 509A/i)).toBeVisible();
		await expect.element(page.getByText('0 kníh')).toBeVisible();
		await expect.element(page.getByRole('list', { name: '0 kníh' })).toBeVisible();
		await expect.element(page.getByRole('heading', { name: 'Zatiaľ nič nepožičiavaš' })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: 'Otvoriť katalóg' }))
			.toHaveAttribute('href', '/books');
		await expect.element(page.getByRole('tab', { name: /Požičané/ })).toHaveAttribute('aria-selected', 'true');
	});

	it('fills loan slots and lists an active slip with a return form', async () => {
		render(LoansPage, {
			data: {
				...empty,
				activeCount: 2,
				loans: [record('Technické kreslenie', { id: 'loan-1' })]
			},
			form: null
		} as never);

		expect(document.querySelectorAll('.folio-slots li')).toHaveLength(2);
		expect(document.querySelectorAll('.folio-slots li.taken')).toHaveLength(2);
		await expect.element(page.getByText('2 knihy')).toBeVisible();

		await expect
			.element(page.getByRole('link', { name: 'Technické kreslenie', exact: true }))
			.toBeVisible();
		await expect.element(page.getByText('Ján Test')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Vrátiť' })).toBeVisible();
		expect(document.querySelector<HTMLInputElement>('input[name="loanId"]')?.value).toBe('loan-1');
	});

	it('switches to returned history', async () => {
		render(LoansPage, {
			data: {
				...empty,
				history: [record('Vrátená učebnica', { id: 'old', returnedAt: new Date(2026, 7, 10) })]
			},
			form: null
		} as never);

		await page.getByRole('tab', { name: /Vrátené/ }).click();

		await expect.element(page.getByRole('tab', { name: /Vrátené/ })).toHaveAttribute('aria-selected', 'true');
		await expect.element(page.getByRole('link', { name: 'Vrátená učebnica' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Vyčistiť vrátené' })).toBeVisible();
		await expect.element(page.getByRole('heading', { name: 'Zatiaľ nič nepožičiavaš' })).not.toBeInTheDocument();
	});

	it('shows a quiet empty archive', async () => {
		render(LoansPage, { data: empty, form: null } as never);

		await page.getByRole('tab', { name: /Vrátené/ }).click();

		await expect.element(page.getByRole('heading', { name: 'Ešte žiadna vrátená kniha' })).toBeVisible();
	});

	it('surfaces a return error', async () => {
		render(LoansPage, {
			data: empty,
			form: { message: 'Výpožička sa nenašla.' }
		} as never);

		await expect.element(page.getByRole('alert')).toHaveTextContent('Výpožička sa nenašla.');
	});

	it('shows a success stamp after a return', async () => {
		render(LoansPage, {
			data: empty,
			form: { stamp: 'Vrátené', sub: '23. 08. 2026' }
		} as never);

		expect(document.querySelector('.lock-seal')?.textContent).toMatch(/Vrátené/);
		await expect.element(page.getByText('23. 08. 2026')).toBeVisible();
	});
});
