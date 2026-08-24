import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formText } from '$lib/server/admin';
import { deleteAuthor, listDeskAuthors, saveAuthor } from '$lib/server/admin-desk';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const edit = url.searchParams.get('edit') ?? '';
	const rows = listDeskAuthors(q);
	const current = rows.find((row) => row.id === edit) ?? null;
	return { q, rows, current };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const result = saveAuthor({
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
		const result = deleteAuthor(formText(data, 'id'));
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Zmazané' };
	}
};
