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
	coverUrl: null,
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
	opts: { id?: string; returnedAt?: Date | null; dueAt?: Date; returnOfferedAt?: Date | null } = {}
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
		renewalCount: 0,
		returnOfferedAt: opts.returnOfferedAt ?? null,
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
	waits: [],
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
		await expect.element(page.getByRole('button', { name: 'Na pult' })).toBeVisible();
		expect(document.querySelector<HTMLInputElement>('input[name="loanId"]')?.value).toBe('loan-1');
	});

	it('hides the gun when the slip is already inbound', async () => {
		render(LoansPage, {
			data: {
				...empty,
				activeCount: 1,
				loans: [record('Technické kreslenie', { id: 'loan-1', returnOfferedAt: new Date() })]
			},
			form: null
		} as never);

		await expect.element(page.getByText('Cestou na pult')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Na pult' })).not.toBeInTheDocument();
	});

	it('offers a renewal on an eligible slip', async () => {
		render(LoansPage, {
			data: {
				...empty,
				activeCount: 1,
				loans: [{ ...record('Technické kreslenie', { id: 'loan-1' }), canRenew: true }]
			},
			form: null
		} as never);

		await expect.element(page.getByRole('button', { name: 'Predĺžiť' })).toBeVisible();
	});

	it('lists a wait slip on the queue tab', async () => {
		render(LoansPage, {
			data: {
				...empty,
				waits: [
					{
						id: 'wait-1',
						bookId: 'stroje-1',
						status: 'pending',
						createdAt: new Date(2026, 7, 20),
						expiresAt: new Date(2026, 8, 19),
						place: 2,
						book: book('Stroje', 'stroje-1')
					}
				]
			},
			form: null
		} as never);

		await page.getByRole('tab', { name: /Čakacie/ }).click();

		await expect.element(page.getByRole('tab', { name: /Čakacie/ })).toHaveAttribute('aria-selected', 'true');
		await expect.element(page.getByText('2. v rade')).toBeVisible();
		await expect.element(page.getByRole('link', { name: 'Stroje' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Stiahnuť' })).toBeVisible();
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
			form: { stamp: 'Na pult', sub: '23. 08. 2026' }
		} as never);

		expect(document.querySelector('.lock-seal')?.textContent).toMatch(/Na pult/);
		await expect.element(page.getByText('23. 08. 2026')).toBeVisible();
	});
});
