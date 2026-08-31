import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formDate, formText } from '$lib/server/admin';
import { pickCurrent } from '$lib/pult-ledger';
import { bookOptions, readerOptions } from '$lib/server/desk/options';
import {
	deleteReservation,
	getDeskReservation,
	listDeskReservations,
	saveReservation
} from '$lib/server/desk/reservations';
import { queueHoldNotice } from '$lib/server/hold-mail';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const edit = url.searchParams.get('edit') ?? '';
	const rows = await listDeskReservations(q);
	const current = await pickCurrent(rows, edit, getDeskReservation);
	const [books, readers] = await Promise.all([bookOptions(), readerOptions()]);
	return { q, rows, current, books, readers };
};

type HoldRow = {
	readerEmail: string | null;
	readerName: string;
	bookTitle: string;
	callNumber?: string | null;
	expiresAt?: Date | null;
};

async function mailHoldChange(
	kind: 'queued' | 'ready' | 'cancelled',
	row: HoldRow | null,
	expiresAt?: Date | null
) {
	if (!row?.readerEmail?.trim()) return;
	await queueHoldNotice({
		kind,
		to: row.readerEmail,
		readerName: row.readerName,
		bookTitle: row.bookTitle,
		callNumber: row.callNumber ?? undefined,
		expiresAt: expiresAt ?? row.expiresAt
	});
}

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const id = formText(data, 'id');
		const status = formText(data, 'status');
		const before = id ? await getDeskReservation(id) : null;
		const result = await saveReservation({
			id: id || undefined,
			bookId: formText(data, 'bookId'),
			userId: formText(data, 'userId'),
			status,
			createdAt: formDate(data, 'createdAt'),
			expiresAt: formDate(data, 'expiresAt')
		});
		if (!result.ok) return fail(400, { message: result.message });

		const savedId = id || result.id || '';
		const after = savedId ? await getDeskReservation(savedId) : null;
		const row = after ?? before;
		const nextStatus = after?.status ?? status;
		const prevStatus = before?.status;
		if (!prevStatus) {
			if (nextStatus === 'pending') await mailHoldChange('queued', row);
			if (nextStatus === 'fulfilled') await mailHoldChange('ready', row, after?.expiresAt);
		} else if (prevStatus !== nextStatus) {
			if (nextStatus === 'fulfilled') await mailHoldChange('ready', row, after?.expiresAt);
			if (nextStatus === 'cancelled') await mailHoldChange('cancelled', row);
		}

		return { stamp: 'Uložené' };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = formText(data, 'id');
		const current = await getDeskReservation(id);
		const result = await deleteReservation(id);
		if (!result.ok) return fail(400, { message: result.message });
		if (current && (current.status === 'pending' || current.status === 'fulfilled')) {
			await mailHoldChange('cancelled', current);
		}
		return { stamp: 'Zmazané' };
	}
};
