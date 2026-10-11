'use server';

import { revalidatePath } from 'next/cache';
import { formInt, formText } from '@/server/admin';
import { drawerRedirect, requireLibrarian } from '@/server/desk-actions';
import { deleteCategory, saveCategory } from '@/server/desk/categories';

const PATH = '/admin/departments';

export async function saveDepartment(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await saveCategory({
		id: formText(formData, 'id') || undefined,
		name: formText(formData, 'name'),
		slug: formText(formData, 'slug'),
		description: formText(formData, 'description'),
		code: formText(formData, 'code'),
		accent: formText(formData, 'accent'),
		sortOrder: formInt(formData, 'sortOrder') ?? 0
	});
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'ok' });
}

export async function deleteDepartment(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await deleteCategory(formText(formData, 'id'));
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'gone' });
}
