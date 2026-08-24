import { isActionFailure } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteCategory, listDeskCategories, saveCategory } from '$lib/server/admin-desk';
import { actions, load } from '../+page.server';

vi.mock('$lib/server/admin-desk', () => ({
	listDeskCategories: vi.fn(),
	saveCategory: vi.fn(),
	deleteCategory: vi.fn()
}));

const odbor = {
	id: 'cat-inf',
	name: 'Informatika',
	slug: 'informatika',
	description: 'Algoritmy.',
	code: 'INF',
	accent: '#2c4a3e',
	sortOrder: 1,
	bookCount: 4
};

describe('admin odbory load', () => {
	beforeEach(() => {
		vi.mocked(listDeskCategories).mockReset();
	});

	it('picks the edited drawer card', async () => {
		vi.mocked(listDeskCategories).mockReturnValue([odbor]);

		const data = (await load({
			url: new URL('http://localhost/admin/odbory?edit=cat-inf&q=inf')
		} as Parameters<typeof load>[0])) as {
			q: string;
			current: typeof odbor | null;
			rows: typeof odbor[];
		};

		expect(listDeskCategories).toHaveBeenCalledWith('inf');
		expect(data.current?.code).toBe('INF');
		expect(data.q).toBe('inf');
	});
});

describe('admin odbory actions', () => {
	beforeEach(() => {
		vi.mocked(saveCategory).mockReset();
		vi.mocked(deleteCategory).mockReset();
	});

	it('returns the desk error as a form failure', async () => {
		vi.mocked(saveCategory).mockReturnValue({ ok: false, message: 'Názov odboru je krátky.' });

		const result = await actions.save?.({
			request: {
				formData: async () => {
					const body = new FormData();
					body.set('name', 'I');
					body.set('code', 'INF');
					body.set('description', 'x');
					body.set('accent', '#3c2a21');
					body.set('sortOrder', '1');
					return body;
				}
			}
		} as unknown as Parameters<NonNullable<typeof actions.save>>[0]);

		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.data).toEqual({ message: 'Názov odboru je krátky.' });
		}
	});

	it('stamps a saved department', async () => {
		vi.mocked(saveCategory).mockReturnValue({ ok: true });

		const result = await actions.save?.({
			request: {
				formData: async () => {
					const body = new FormData();
					body.set('name', 'Informatika');
					body.set('code', 'INF');
					body.set('description', 'Algoritmy.');
					body.set('accent', '#2c4a3e');
					body.set('sortOrder', '1');
					return body;
				}
			}
		} as unknown as Parameters<NonNullable<typeof actions.save>>[0]);

		expect(result).toEqual({ stamp: 'Uložené' });
	});

	it('stamps a deleted department and surfaces a blocked delete', async () => {
		vi.mocked(deleteCategory).mockReturnValueOnce({ ok: true });
		const removed = await actions.delete?.({
			request: {
				formData: async () => {
					const body = new FormData();
					body.set('id', 'cat-inf');
					return body;
				}
			}
		} as unknown as Parameters<NonNullable<typeof actions.delete>>[0]);
		expect(removed).toEqual({ stamp: 'Zmazané' });

		vi.mocked(deleteCategory).mockReturnValueOnce({
			ok: false,
			message: 'Odbor má knihy. Najprv ich presuň alebo zmaž.'
		});
		const blocked = await actions.delete?.({
			request: {
				formData: async () => {
					const body = new FormData();
					body.set('id', 'cat-inf');
					return body;
				}
			}
		} as unknown as Parameters<NonNullable<typeof actions.delete>>[0]);
		expect(isActionFailure(blocked)).toBe(true);
		if (isActionFailure(blocked)) {
			expect(blocked.data).toEqual({ message: 'Odbor má knihy. Najprv ich presuň alebo zmaž.' });
		}
	});
});
