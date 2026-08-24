import { describe, expect, it, vi } from 'vitest';
import { requireAdmin } from '$lib/server/admin-access';
import { load } from '../+layout.server';

vi.mock('$lib/server/admin-access', () => ({
	requireAdmin: vi.fn()
}));

const librarian = {
	id: 'user-1',
	name: 'Anna Pult',
	email: 'anna@spst.sk',
	role: 'librarian' as const
};

describe('admin layout', () => {
	it('asks the desk guard with the current reader', async () => {
		vi.mocked(requireAdmin).mockImplementation(() => {
			throw new Error('redirect');
		});

		await expect(load({ locals: {} } as Parameters<typeof load>[0])).rejects.toThrow('redirect');
		expect(requireAdmin).toHaveBeenCalledWith(undefined);
	});

	it('exposes the desk pass', async () => {
		vi.mocked(requireAdmin).mockReturnValue(librarian);

		const data = await load({ locals: { user: librarian } } as Parameters<typeof load>[0]);

		expect(data.desk).toEqual(librarian);
	});
});
