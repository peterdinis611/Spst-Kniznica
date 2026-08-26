import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listCategoryChips } from '$lib/server/library';
import { pageOf } from '$lib/page-of';
import { load } from '../+layout.server';

vi.mock('$app/environment', () => ({
	dev: false,
	browser: false,
	building: false
}));

vi.mock('$lib/server/library', () => ({
	listCategoryChips: vi.fn()
}));

const reader = {
	id: 'user-509a',
	name: 'Peter Dinis',
	email: 'peter@spst.sk',
	role: 'reader' as const
};

const librarian = {
	...reader,
	id: 'user-1',
	name: 'Anna Pult',
	email: 'anna@spst.sk',
	role: 'librarian' as const
};

const chip = {
	id: 'cat-inf',
	name: 'Informatika',
	slug: 'informatika',
	code: 'INF',
	accent: '#2c4a3e',
	bookCount: 4
};

describe('root layout', () => {
	beforeEach(() => {
		vi.mocked(listCategoryChips).mockReset();
		vi.mocked(listCategoryChips).mockResolvedValue([chip]);
	});

	it('skips the catalog chips on the hall and login', async () => {
		const hall = pageOf(
			await load({
				locals: { user: reader },
				url: new URL('http://localhost/')
			} as Parameters<typeof load>[0])
		);

		expect(hall.categories).toEqual([]);
		expect(hall.admin).toBe(false);
		expect(listCategoryChips).not.toHaveBeenCalled();
	});

	it('loads chips and the admin flag on the desk', async () => {
		const data = pageOf(
			await load({
				locals: { user: librarian },
				url: new URL('http://localhost/discover')
			} as Parameters<typeof load>[0])
		);

		expect(data.admin).toBe(true);
		expect(data.categories).toEqual([chip]);
	});
});
