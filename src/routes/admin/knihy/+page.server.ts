import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formBool, formInt, formText } from '$lib/server/admin';
import { pickCurrent } from '$lib/pult-ledger';
import {
	authorOptions,
	bookAuthorIds,
	categoryOptions,
	deleteBook,
	getDeskBook,
	listDeskBooks,
	saveBook
} from '$lib/server/admin-desk';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const edit = url.searchParams.get('edit') ?? '';
	const rows = listDeskBooks(q);
	const current = pickCurrent(rows, edit, getDeskBook);
	const linked = current ? bookAuthorIds(current.id) : [];
	return {
		q,
		rows,
		current,
		linkedIds: linked.map((item) => item.authorId),
		categories: categoryOptions(),
		authors: authorOptions()
	};
};

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const result = saveBook({
			id: formText(data, 'id') || undefined,
			title: formText(data, 'title'),
			subtitle: formText(data, 'subtitle'),
			year: formInt(data, 'year') ?? 0,
			pages: formInt(data, 'pages') ?? 0,
			isbn: formText(data, 'isbn'),
			description: formText(data, 'description'),
			callNumber: formText(data, 'callNumber'),
			categoryId: formText(data, 'categoryId'),
			publisher: formText(data, 'publisher'),
			language: formText(data, 'language'),
			featured: formBool(data, 'featured'),
			authorIds: data.getAll('authorIds').map((value) => value.toString()),
			copies: formInt(data, 'copies') ?? 1
		});
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Uložené' };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const result = deleteBook(formText(data, 'id'));
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Zmazané' };
	}
};
