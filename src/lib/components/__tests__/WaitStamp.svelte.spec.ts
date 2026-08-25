import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WaitStamp from '../WaitStamp.svelte';

vi.mock('$app/state', () => ({
	navigating: {
		from: null,
		to: null,
		type: null,
		willUnload: null,
		delta: null,
		complete: null
	}
}));

describe('WaitStamp', () => {
	it('stays off the blotter when the desk is idle', async () => {
		render(WaitStamp);

		await expect.element(page.getByRole('status')).not.toBeInTheDocument();
	});

	it('presses the SPŠT stamp while the fond is listing', async () => {
		render(WaitStamp, { preview: true });

		await expect.element(page.getByRole('status')).toBeVisible();
		await expect.element(page.getByText('Listujem fond')).toBeVisible();
		await expect.element(page.getByText('SPŠT')).toBeVisible();
	});
});
