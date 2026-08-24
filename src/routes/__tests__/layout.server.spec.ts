import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isAdminEmail } from '$lib/server/admin-access';
import { listCategoryChips } from '$lib/server/library';
import { load } from '../+layout.server';

vi.mock('$lib/server/admin-access', () => ({
	isAdminEmail: vi.fn()
}));

vi.mock('$lib/server/library', () => ({
	listCategoryChips: vi.fn()
}));

const reader = { id: 'user-509a', name: 'Peter Dinis', email: 'peter@spst.sk' };
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
		vi.mocked(isAdminEmail).mockReset();
		vi.mocked(listCategoryChips).mockReset();
		vi.mocked(listCategoryChips).mockReturnValue([chip]);
	});

	it('skips the catalog chips on the hall and login', async () => {
		vi.mocked(isAdminEmail).mockReturnValue(false);

		const hall = await load({
			locals: { user: reader },
			url: new URL('http://localhost/')
		} as Parameters<typeof load>[0]);

		expect(hall.categories).toEqual([]);
		expect(hall.admin).toBe(false);
		expect(listCategoryChips).not.toHaveBeenCalled();
	});

	it('loads chips and the admin flag on the desk', async () => {
		vi.mocked(isAdminEmail).mockReturnValue(true);

		const data = await load({
			locals: { user: reader },
			url: new URL('http://localhost/discover')
		} as Parameters<typeof load>[0]);

		expect(data.admin).toBe(true);
		expect(data.categories).toEqual([chip]);
		expect(isAdminEmail).toHaveBeenCalledWith(reader.email);
	});
});
