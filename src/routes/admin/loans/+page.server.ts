import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { normalizeClass } from '$lib/borrow-fields';
import { formDate, formInt, formText } from '$lib/server/admin';
import { pickCurrent } from '$lib/pult-ledger';
import { canOperateDesk } from '$lib/server/admin-access';
import { getBook } from '$lib/server/library';
import { queueLoanNotice } from '$lib/server/loan-mail';
import { deleteLoan, getDeskLoan, listDeskClasses, listDeskLoans, parseDeskLoanFilter, returnDeskLoan, saveLoan } from '$lib/server/desk/loans';
import { bookOptions, readerOptions } from '$lib/server/desk/options';

export const load: PageServerLoad = async ({ url, locals }) => {
	const manage = canOperateDesk(locals.user);
	const filter = parseDeskLoanFilter(url);
	if (!manage) {
		filter.open = true;
		if (!filter.klass) {
			filter.klass = normalizeClass(locals.user?.className ?? '');
		}
		if (!filter.klass) {
			return {
				manage,
				...filter,
				rows: [],
				current: null,
				books: [],
				readers: [],
				classes: await listDeskClasses()
			};
		}
	}
	const edit = manage ? (url.searchParams.get('edit') ?? '') : '';
	const [rows, classes, books, readers] = await Promise.all([
		listDeskLoans(filter),
		listDeskClasses(),
		manage ? bookOptions() : Promise.resolve([]),
		manage ? readerOptions() : Promise.resolve([])
	]);
	const current = manage ? await pickCurrent(rows, edit, getDeskLoan) : null;
	return { manage, ...filter, rows, current, books, readers, classes };
};

async function refuseIfInspect(locals: App.Locals) {
	if (!canOperateDesk(locals.user)) return fail(403, { message: 'Triedu vidíš. Lístok nemeníš.' });
	return null;
}

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const blocked = await refuseIfInspect(locals);
		if (blocked) return blocked;
		const data = await request.formData();
		const userId = formText(data, 'userId');
		const bookId = formText(data, 'bookId');
		const id = formText(data, 'id');
		const isNew = !id;
		const days = formInt(data, 'loanDays') ?? 0;
		const dueAt = formDate(data, 'dueAt');
		const current = isNew ? null : await getDeskLoan(id);
		const result = await saveLoan({
			id: id || undefined,
			bookId,
			holdingId: formText(data, 'holdingId'),
			userId,
			borrowerFirstName: formText(data, 'borrowerFirstName'),
			borrowerLastName: formText(data, 'borrowerLastName'),
			borrowerClass: formText(data, 'borrowerClass'),
			loanDays: days,
			borrowedAt: formDate(data, 'borrowedAt'),
			dueAt,
			returnedAt: formDate(data, 'returnedAt'),
			renewalCount: formInt(data, 'renewalCount') ?? 0
		});
		if (!result.ok) return fail(400, { message: result.message });
		if (isNew) {
			const held = await getBook(bookId);
			const pass = (await readerOptions()).find((item) => item.id === userId);
			const stamp =
				dueAt ?? new Date(Date.now() + Math.max(days, 1) * 24 * 60 * 60 * 1000);
			if (held && pass?.email) {
				await queueLoanNotice({
					kind: 'borrow',
					to: pass.email,
					readerName: `${formText(data, 'borrowerFirstName')} ${formText(data, 'borrowerLastName')}`.trim() ||
						pass.name,
					bookTitle: held.title,
					callNumber: held.callNumber,
					dueAt: stamp,
					className: formText(data, 'borrowerClass'),
					days
				});
			}
		} else if (
			current &&
			!current.returnedAt &&
			!formDate(data, 'returnedAt') &&
			dueAt &&
			Math.abs(dueAt.getTime() - current.dueAt.getTime()) > 60_000
		) {
			await queueLoanNotice({
				kind: 'dueChanged',
				to: current.readerEmail,
				readerName: current.readerName,
				bookTitle: current.bookTitle,
				callNumber: current.callNumber,
				dueAt,
				className: formText(data, 'borrowerClass') || current.borrowerClass
			});
		}
		return { stamp: 'Uložené' };
	},
	return: async ({ request, locals }) => {
		const blocked = await refuseIfInspect(locals);
		if (blocked) return blocked;
		const data = await request.formData();
		const id = formText(data, 'id');
		const current = await getDeskLoan(id);
		const result = await returnDeskLoan(id);
		if (!result.ok) return fail(400, { message: result.message });
		if (current?.readerEmail) {
			await queueLoanNotice({
				kind: 'return',
				to: current.readerEmail,
				readerName: current.readerName,
				bookTitle: current.bookTitle
			});
		}
		return { stamp: 'Vrátené' };
	},
	delete: async ({ request, locals }) => {
		const blocked = await refuseIfInspect(locals);
		if (blocked) return blocked;
		const data = await request.formData();
		const result = await deleteLoan(formText(data, 'id'));
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Zmazané' };
	}
};
