import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PultDelete from '../PultDelete.svelte';

vi.mock('$app/forms', () => ({
	enhance: () => ({ destroy() {} })
}));

describe('PultDelete', () => {
	it('posts hidden ids after a confirmed stamp', async () => {
		const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
		render(PultDelete, { fields: { id: 'cat-inf' }, ask: 'Zmazať odbor Informatika?' });

		const form = document.querySelector('form');
		expect(form?.getAttribute('action')).toBe('?/delete');
		expect(document.querySelector<HTMLInputElement>('input[name="id"]')?.value).toBe('cat-inf');

		const submitted = vi.fn((event: Event) => event.preventDefault());
		form?.addEventListener('submit', submitted);
		await page.getByRole('button', { name: 'Zmazať' }).click();

		expect(confirm).toHaveBeenCalledWith('Zmazať odbor Informatika?');
		expect(submitted).toHaveBeenCalledTimes(1);
		confirm.mockRestore();
	});

	it('keeps the card when the librarian cancels', async () => {
		const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
		render(PultDelete, { fields: { id: 'cat-inf' } });

		const form = document.querySelector('form');
		const submitted = vi.fn();
		form?.addEventListener('submit', submitted);
		await page.getByRole('button', { name: 'Zmazať' }).click();

		expect(submitted).toHaveBeenCalledTimes(1);
		expect(submitted.mock.calls[0]?.[0]).toBeInstanceOf(Event);
		expect((submitted.mock.calls[0]?.[0] as Event).defaultPrevented).toBe(true);
		confirm.mockRestore();
	});
});
