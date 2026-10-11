'use server';

import { revalidatePath } from 'next/cache';
import { formText } from '@/server/admin';
import { drawerRedirect, requireLibrarian } from '@/server/desk-actions';
import { deleteAuthor, saveAuthor } from '@/server/desk/authors';

const PATH = '/admin/authors';

export async function saveAuthorAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await saveAuthor({
		id: formText(formData, 'id') || undefined,
		name: formText(formData, 'name'),
		slug: formText(formData, 'slug'),
		bio: formText(formData, 'bio'),
		lifespan: formText(formData, 'lifespan'),
		role: formText(formData, 'role')
	});
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'ok' });
}

export async function deleteAuthorAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await deleteAuthor(formText(formData, 'id'));
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'gone' });
}
