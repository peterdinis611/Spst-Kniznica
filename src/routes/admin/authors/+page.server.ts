import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formText } from '$lib/server/admin';
import { pickCurrent } from '$lib/pult-ledger';
import { deleteAuthor, getDeskAuthor, listDeskAuthors, saveAuthor } from '$lib/server/desk/authors';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const edit = url.searchParams.get('edit') ?? '';
	const rows = await listDeskAuthors(q);
	const current = await pickCurrent(rows, edit, getDeskAuthor);
	return { q, rows, current };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const result = await saveAuthor({
			id: formText(data, 'id') || undefined,
			name: formText(data, 'name'),
			slug: formText(data, 'slug'),
			bio: formText(data, 'bio'),
			lifespan: formText(data, 'lifespan'),
			role: formText(data, 'role')
		});
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Uložené' };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const result = await deleteAuthor(formText(data, 'id'));
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Zmazané' };
	}
};
