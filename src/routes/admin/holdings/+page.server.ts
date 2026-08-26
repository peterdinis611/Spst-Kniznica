import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formDate, formText } from '$lib/server/admin';
import { pickCurrent } from '$lib/pult-ledger';
import { bookOptions, deleteHolding, getDeskHolding, listDeskHoldings, saveHolding } from '$lib/server/admin-desk';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const edit = url.searchParams.get('edit') ?? '';
	const rows = await listDeskHoldings(q);
	const current = await pickCurrent(rows, edit, getDeskHolding);
	return { q, rows, current, books: await bookOptions() };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const result = await saveHolding({
			id: formText(data, 'id') || undefined,
			bookId: formText(data, 'bookId'),
			inventoryNo: formText(data, 'inventoryNo'),
			status: formText(data, 'status'),
			acquiredAt: formDate(data, 'acquiredAt')
		});
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Uložené' };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const result = await deleteHolding(formText(data, 'id'));
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Zmazané' };
	}
};
