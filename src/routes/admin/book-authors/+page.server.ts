import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formInt, formText } from '$lib/server/admin';
import { authorOptions, bookOptions, deleteLink, listDeskLinks, saveLink } from '$lib/server/admin-desk';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const [rows, books, authors] = await Promise.all([
		listDeskLinks(q),
		bookOptions(),
		authorOptions()
	]);
	return {
		q,
		rows,
		books,
		authors
	};
};

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const result = await saveLink({
			bookId: formText(data, 'bookId'),
			authorId: formText(data, 'authorId'),
			position: formInt(data, 'position') ?? 0
		});
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Uložené' };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const result = await deleteLink(formText(data, 'bookId'), formText(data, 'authorId'));
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Zmazané' };
	}
};
