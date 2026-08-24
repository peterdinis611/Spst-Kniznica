import { isActionFailure } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteReservation, saveReservation } from '$lib/server/admin-desk';
import { actions } from '../+page.server';

vi.mock('$lib/server/admin-desk', () => ({
	listDeskReservations: vi.fn(),
	getDeskReservation: vi.fn(),
	bookOptions: vi.fn(),
	readerOptions: vi.fn(),
	saveReservation: vi.fn(),
	deleteReservation: vi.fn()
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

describe('admin rezervacie actions', () => {
	beforeEach(() => {
		vi.mocked(saveReservation).mockReset();
		vi.mocked(deleteReservation).mockReset();
	});

	it('saves a waiting slip', async () => {
		vi.mocked(saveReservation).mockReturnValue({ ok: true });
		expect(
			await actions.save?.(event({ bookId: 'book-1', userId: 'user-1', status: 'pending' }))
		).toEqual({ stamp: 'Uložené' });
	});

	it('returns a missing reservation as a failure', async () => {
		vi.mocked(deleteReservation).mockReturnValue({ ok: false, message: 'Rezervácia sa nenašla.' });
		const result = await actions.delete?.(event({ id: 'missing' }));
		expect(isActionFailure(result)).toBe(true);
	});
});
