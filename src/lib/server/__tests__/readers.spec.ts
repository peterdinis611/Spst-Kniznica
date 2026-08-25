import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isAdminEmail } from '../admin-access';

vi.mock('../admin-access', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../admin-access')>();
	return {
		...actual,
		isAdminEmail: vi.fn()
	};
});

const get = vi.fn();
const run = vi.fn();
const where = vi.fn(() => ({ get, run }));
const set = vi.fn(() => ({ where }));
const values = vi.fn(() => ({ run }));

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
		get.mockReset();
		run.mockReset();
		set.mockClear();
		values.mockClear();
		vi.mocked(isAdminEmail).mockReturnValue(false);
	});

	it('drops an empty address', () => {
		expect(ensureLocalReader({ id: 'u1', email: '  ', name: 'Peter' })).toBeNull();
	});

	it('inserts a new pass from the local part when the name is thin', () => {
		get.mockReturnValue(undefined);

		const reader = ensureLocalReader({
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
			role: 'reader'
		});
	});

	it('promotes a bootstrap librarian on insert', () => {
		get.mockReturnValue(undefined);
		vi.mocked(isAdminEmail).mockReturnValue(true);

		const reader = ensureLocalReader({
			id: 'user-1',
			email: 'anna@spst.sk',
			name: 'Anna Pult'
		});

		expect(reader?.role).toBe('librarian');
	});

	it('refreshes a stale local row', () => {
		get.mockReturnValue({
			id: 'user-1',
			name: 'Old',
			email: 'old@spst.sk',
			role: 'reader',
			emailVerified: false
		});

		const reader = ensureLocalReader({
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
			role: 'reader'
		});
	});
});

describe('readerFromClaims', () => {
	beforeEach(() => {
		get.mockReset();
		get.mockReturnValue(undefined);
		vi.mocked(isAdminEmail).mockReturnValue(false);
	});

	it('needs a subject', () => {
		expect(readerFromClaims({ email: 'peter@spst.sk' })).toBeNull();
	});

	it('reads the name from user metadata', () => {
		const reader = readerFromClaims({
			sub: 'user-1',
			email: 'peter@spst.sk',
			user_metadata: { name: 'Peter Dinis' }
		});

		expect(reader?.name).toBe('Peter Dinis');
	});
});
