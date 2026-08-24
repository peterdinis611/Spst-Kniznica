import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formDate, formText } from '$lib/server/admin';
import {
	bookOptions,
	deleteReservation,
	listDeskReservations,
	readerOptions,
	saveReservation
} from '$lib/server/admin-desk';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const edit = url.searchParams.get('edit') ?? '';
	const rows = listDeskReservations(q);
	const current = rows.find((row) => row.id === edit) ?? null;
	return { q, rows, current, books: bookOptions(), readers: readerOptions() };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const result = saveReservation({
			id: formText(data, 'id') || undefined,
			bookId: formText(data, 'bookId'),
			userId: formText(data, 'userId'),
			status: formText(data, 'status'),
			createdAt: formDate(data, 'createdAt'),
			expiresAt: formDate(data, 'expiresAt')
		});
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Uložené' };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const result = deleteReservation(formText(data, 'id'));
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Zmazané' };
	}
};
