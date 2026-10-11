'use server';

import { revalidatePath } from 'next/cache';
import { formDate, formText } from '@/server/admin';
import { drawerRedirect, requireLibrarian } from '@/server/desk-actions';
import { deleteHolding, saveHolding } from '@/server/desk/holdings';

const PATH = '/admin/holdings';

export async function saveHoldingAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await saveHolding({
		id: formText(formData, 'id') || undefined,
		bookId: formText(formData, 'bookId'),
		inventoryNo: formText(formData, 'inventoryNo'),
		status: formText(formData, 'status'),
		acquiredAt: formDate(formData, 'acquiredAt')
	});
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'ok' });
}

export async function deleteHoldingAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await deleteHolding(formText(formData, 'id'));
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'gone' });
}
