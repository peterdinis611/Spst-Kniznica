import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formText } from '$lib/server/admin';
import { pickCurrent } from '$lib/pult-ledger';
import { deleteReader, getDeskReader, listDeskReaders, saveReader } from '$lib/server/desk/readers';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const edit = url.searchParams.get('edit') ?? '';
	const rows = await listDeskReaders(q);
	const current = await pickCurrent(rows, edit, getDeskReader);
	return { q, rows, current };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const result = await saveReader({
			id: formText(data, 'id'),
			name: formText(data, 'name'),
			email: formText(data, 'email'),
			role: formText(data, 'role')
		});
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Uložené' };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const result = await deleteReader(formText(data, 'id'));
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Zmazané' };
	}
};
