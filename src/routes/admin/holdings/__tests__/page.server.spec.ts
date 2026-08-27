import { isActionFailure } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteHolding, saveHolding } from '$lib/server/desk/holdings';
import { actions } from '../+page.server';

vi.mock('$lib/server/desk/holdings', () => ({
	listDeskHoldings: vi.fn(),
	getDeskHolding: vi.fn(),
	saveHolding: vi.fn(),
	deleteHolding: vi.fn()
}));

vi.mock('$lib/server/desk/options', () => ({
	bookOptions: vi.fn()
}));

function event(fields: Record<string, string>) {
	return {
		request: {
			formData: async () => {
				const body = new FormData();
				for (const [key, value] of Object.entries(fields)) body.set(key, value);
				return body;
			}
		}
	} as unknown as Parameters<NonNullable<typeof actions.save>>[0];
}

describe('admin vytlacky actions', () => {
	beforeEach(() => {
		vi.mocked(saveHolding).mockReset();
		vi.mocked(deleteHolding).mockReset();
	});

	it('saves a copy status', async () => {
		vi.mocked(saveHolding).mockResolvedValue({ ok: true });
		expect(
			await actions.save?.(
				event({ bookId: 'book-1', inventoryNo: 'INF-1', status: 'available' })
			)
		).toEqual({ stamp: 'Uložené' });
	});

	it('blocks a delete of a loaned copy', async () => {
		vi.mocked(deleteHolding).mockResolvedValue({
			ok: false,
			message: 'Výtlačok je na výpožičke. Najprv ho vráť.'
		});
		const result = await actions.delete?.(event({ id: 'h-1' }));
		expect(isActionFailure(result)).toBe(true);
	});
});
