'use server';

import { revalidatePath } from 'next/cache';
import { formBool, formInt, formText } from '@/server/admin';
import { drawerRedirect, requireLibrarian } from '@/server/desk-actions';
import { deleteBook, saveBook } from '@/server/desk/books';

const PATH = '/admin/books';

export async function saveBookAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await saveBook({
		id: formText(formData, 'id') || undefined,
		title: formText(formData, 'title'),
		subtitle: formText(formData, 'subtitle'),
		year: formInt(formData, 'year') ?? 0,
		pages: formInt(formData, 'pages') ?? 0,
		isbn: formText(formData, 'isbn'),
		description: formText(formData, 'description'),
		callNumber: formText(formData, 'callNumber'),
		categoryId: formText(formData, 'categoryId'),
		publisher: formText(formData, 'publisher'),
		language: formText(formData, 'language'),
		featured: formBool(formData, 'featured'),
		authorIds: formData.getAll('authorIds').map((value) => value.toString()),
		copies: formInt(formData, 'copies') ?? 1,
		coverUrl: formText(formData, 'coverUrl'),
		coverKey: formText(formData, 'coverKey')
	});
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'ok' });
}

export async function deleteBookAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await deleteBook(formText(formData, 'id'));
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'gone' });
}
