import { isActionFailure } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteReservation, getDeskReservation, saveReservation } from '$lib/server/desk/reservations';
import { queueHoldNotice } from '$lib/server/hold-mail';
import { actions } from '../+page.server';

vi.mock('$lib/server/desk/reservations', () => ({
	listDeskReservations: vi.fn(),
	getDeskReservation: vi.fn(),
	saveReservation: vi.fn(),
	deleteReservation: vi.fn()
}));

vi.mock('$lib/server/desk/options', () => ({
	bookOptions: vi.fn(),
	readerOptions: vi.fn()
}));

vi.mock('$lib/server/hold-mail', () => ({
	queueHoldNotice: vi.fn()
}));

const slip = {
	id: 'res-1',
	bookId: 'book-1',
	userId: 'user-1',
	createdAt: new Date('2026-08-24T10:00:00Z'),
	expiresAt: new Date('2026-08-31T10:00:00Z'),
	status: 'pending' as const,
	bookTitle: 'Algoritmy v dielni',
	callNumber: 'INF 004.4 ALG',
	readerName: 'Peter Dinis',
	readerEmail: 'peter@spst.sk'
};

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
		vi.mocked(getDeskReservation).mockReset();
		vi.mocked(queueHoldNotice).mockReset();
	});

	it('saves a waiting slip and mails the queue ticket', async () => {
		vi.mocked(saveReservation).mockResolvedValue({ ok: true, id: 'res-1' });
		vi.mocked(getDeskReservation).mockResolvedValue(slip);
		expect(
			await actions.save?.(event({ bookId: 'book-1', userId: 'user-1', status: 'pending' }))
		).toEqual({ stamp: 'Uložené' });
		expect(queueHoldNotice).toHaveBeenCalledWith(
			expect.objectContaining({
				kind: 'queued',
				to: 'peter@spst.sk',
				bookTitle: 'Algoritmy v dielni'
			})
		);
	});

	it('mails a ready hold when the desk puts the copy on the counter', async () => {
		vi.mocked(getDeskReservation)
			.mockResolvedValueOnce(slip)
			.mockResolvedValueOnce({ ...slip, status: 'fulfilled' });
		vi.mocked(saveReservation).mockResolvedValue({ ok: true, id: 'res-1' });
		expect(
			await actions.save?.(
				event({ id: 'res-1', bookId: 'book-1', userId: 'user-1', status: 'fulfilled' })
			)
		).toEqual({ stamp: 'Uložené' });
		expect(queueHoldNotice).toHaveBeenCalledWith(
			expect.objectContaining({ kind: 'ready', to: 'peter@spst.sk' })
		);
	});

	it('mails a cancel when the desk drops the queue', async () => {
		vi.mocked(getDeskReservation).mockResolvedValue(slip);
		vi.mocked(deleteReservation).mockResolvedValue({ ok: true });
		expect(await actions.delete?.(event({ id: 'res-1' }))).toEqual({ stamp: 'Zmazané' });
		expect(queueHoldNotice).toHaveBeenCalledWith(
			expect.objectContaining({ kind: 'cancelled', to: 'peter@spst.sk' })
		);
	});

	it('returns a missing reservation as a failure', async () => {
		vi.mocked(getDeskReservation).mockResolvedValue(null);
		vi.mocked(deleteReservation).mockResolvedValue({ ok: false, message: 'Rezervácia sa nenašla.' });
		const result = await actions.delete?.(event({ id: 'missing' }));
		expect(isActionFailure(result)).toBe(true);
		expect(queueHoldNotice).not.toHaveBeenCalled();
	});
});
