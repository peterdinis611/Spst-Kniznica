import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formInt, formText } from '$lib/server/admin';
import { deleteCategory, listDeskCategories, saveCategory } from '$lib/server/admin-desk';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const edit = url.searchParams.get('edit') ?? '';
	const rows = listDeskCategories(q);
	const current = rows.find((row) => row.id === edit) ?? null;
	return { q, rows, current };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const result = saveCategory({
			id: formText(data, 'id') || undefined,
			name: formText(data, 'name'),
			slug: formText(data, 'slug'),
			description: formText(data, 'description'),
			code: formText(data, 'code'),
			accent: formText(data, 'accent'),
			sortOrder: formInt(data, 'sortOrder') ?? 0
		});
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Uložené' };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const result = deleteCategory(formText(data, 'id'));
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Zmazané' };
	}
};
