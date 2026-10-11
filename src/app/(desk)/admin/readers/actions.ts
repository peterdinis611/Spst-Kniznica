'use server';

import { revalidatePath } from 'next/cache';
import { formText } from '@/server/admin';
import { drawerRedirect, requireLibrarian } from '@/server/desk-actions';
import { rollSchoolYear } from '@/server/desk/classes';
import { deleteReader, saveReader } from '@/server/desk/readers';

const PATH = '/admin/readers';

export async function saveReaderAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await saveReader({
		id: formText(formData, 'id'),
		name: formText(formData, 'name'),
		email: formText(formData, 'email'),
		role: formText(formData, 'role'),
		className: formText(formData, 'className')
	});
	revalidatePath(PATH);
	if (!result.ok)
		drawerRedirect(PATH, { q, edit: formText(formData, 'id'), fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'ok' });
}

export async function deleteReaderAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await deleteReader(formText(formData, 'id'));
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'gone' });
}

export async function rollYearAction() {
	await requireLibrarian(PATH);
	await rollSchoolYear();
	revalidatePath(PATH);
	drawerRedirect(PATH, { stamp: 'year' });
}
