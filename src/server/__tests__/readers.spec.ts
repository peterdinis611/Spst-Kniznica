import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isAdminEmail } from '../admin-access';

vi.mock('../admin-access', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../admin-access')>();
	return {
		...actual,
		isAdminEmail: vi.fn()
	};
});

const where = vi.fn();
const set = vi.fn(() => ({ where }));
const values = vi.fn();

vi.mock('../db', () => ({
	db: {
		select: () => ({ from: () => ({ where }) }),
		update: () => ({ set }),
		insert: () => ({ values })
	}
}));

import { ensureLocalReader, readerFromClaims } from '../readers';

describe('ensureLocalReader', () => {
	beforeEach(() => {
		where.mockReset();
		where.mockResolvedValue([]);
		set.mockClear();
		values.mockReset();
		values.mockResolvedValue([]);
		vi.mocked(isAdminEmail).mockReturnValue(false);
	});

	it('drops an empty address', async () => {
		expect(await ensureLocalReader({ id: 'u1', email: '  ', name: 'Peter' })).toBeNull();
	});

	it('inserts a new pass from the local part when the name is thin', async () => {
		const reader = await ensureLocalReader({
			id: 'user-1',
			email: 'peter@spst.sk',
			name: 'P'
		});

		expect(values).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'user-1',
				name: 'peter',
				email: 'peter@spst.sk',
				role: 'reader',
				emailVerified: true
			})
		);
		expect(reader).toEqual({
			id: 'user-1',
			name: 'peter',
			email: 'peter@spst.sk',
			role: 'reader',
			className: ''
		});
	});

	it('promotes a bootstrap librarian on insert', async () => {
		vi.mocked(isAdminEmail).mockReturnValue(true);

		const reader = await ensureLocalReader({
			id: 'user-1',
			email: 'anna@spst.sk',
			name: 'Anna Pult'
		});

		expect(reader?.role).toBe('librarian');
	});

	it('refreshes a stale local row', async () => {
		where.mockResolvedValueOnce([
			{
				id: 'user-1',
				name: 'Old',
				email: 'old@spst.sk',
				role: 'reader',
				emailVerified: false
			}
		]);

		const reader = await ensureLocalReader({
			id: 'user-1',
			email: 'peter@spst.sk',
			name: 'Peter Dinis'
		});

		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Peter Dinis',
				email: 'peter@spst.sk',
				emailVerified: true,
				role: 'reader'
			})
		);
		expect(reader).toEqual({
			id: 'user-1',
			name: 'Peter Dinis',
			email: 'peter@spst.sk',
			role: 'reader',
			className: ''
		});
	});
});

describe('readerFromClaims', () => {
	beforeEach(() => {
		where.mockReset();
		where.mockResolvedValue([]);
		values.mockReset();
		values.mockResolvedValue([]);
		vi.mocked(isAdminEmail).mockReturnValue(false);
	});

	it('needs a subject', async () => {
		expect(await readerFromClaims({ email: 'peter@spst.sk' })).toBeNull();
	});

	it('reads the name from user metadata', async () => {
		const reader = await readerFromClaims({
			sub: 'user-1',
			email: 'peter@spst.sk',
			user_metadata: { name: 'Peter Dinis' }
		});

		expect(reader?.name).toBe('Peter Dinis');
	});
});
