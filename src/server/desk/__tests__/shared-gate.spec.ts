import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db', () => ({ db: {}, sqlClient: {} }));

vi.mock('../../session', () => ({
	getSessionReader: vi.fn()
}));

vi.mock('../../admin-access', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../../admin-access')>();
	return {
		...actual,
		canOperateDesk: vi.fn()
	};
});

import { canOperateDesk } from '../../admin-access';
import { getSessionReader } from '../../session';
import { assertOperateDesk } from '../shared';

describe('assertOperateDesk', () => {
	const prev = process.env.VITEST;

	afterEach(() => {
		process.env.VITEST = prev;
		vi.mocked(getSessionReader).mockReset();
		vi.mocked(canOperateDesk).mockReset();
	});

	it('skips the stamp under Vitest', async () => {
		process.env.VITEST = '1';
		expect(await assertOperateDesk()).toBeNull();
		expect(getSessionReader).not.toHaveBeenCalled();
	});

	it('refuses a reader outside Vitest', async () => {
		delete process.env.VITEST;
		vi.mocked(getSessionReader).mockResolvedValue({
			id: 'u1',
			name: 'Peter',
			email: 'peter@spst.sk',
			role: 'reader',
			className: ''
		});
		vi.mocked(canOperateDesk).mockReturnValue(false);

		expect(await assertOperateDesk()).toEqual({
			ok: false,
			message: 'Pult je len pre správu fondu.'
		});
	});
});
