'use server';

import { revalidatePath } from 'next/cache';
import { formDate, formText } from '@/server/admin';
import { drawerRedirect, requireLibrarian } from '@/server/desk-actions';
import { deleteReservation, saveReservation } from '@/server/desk/reservations';

const PATH = '/admin/reservations';

export async function saveReservationAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await saveReservation({
		id: formText(formData, 'id') || undefined,
		bookId: formText(formData, 'bookId'),
		userId: formText(formData, 'userId'),
		status: formText(formData, 'status'),
		createdAt: formDate(formData, 'createdAt'),
		expiresAt: formDate(formData, 'expiresAt')
	});
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'ok' });
}

export async function deleteReservationAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await deleteReservation(formText(formData, 'id'));
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'gone' });
}
