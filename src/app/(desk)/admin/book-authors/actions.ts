'use server';

import { revalidatePath } from 'next/cache';
import { formInt, formText } from '@/server/admin';
import { drawerRedirect, requireLibrarian } from '@/server/desk-actions';
import { deleteLink, saveLink } from '@/server/desk/links';

const PATH = '/admin/book-authors';

export async function saveLinkAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await saveLink({
		bookId: formText(formData, 'bookId'),
		authorId: formText(formData, 'authorId'),
		position: formInt(formData, 'position') ?? 0
	});
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'ok' });
}

export async function deleteLinkAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await deleteLink(formText(formData, 'bookId'), formText(formData, 'authorId'));
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'gone' });
}
