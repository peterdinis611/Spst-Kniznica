import { describe, expect, it, vi } from 'vitest';

vi.mock('../db', () => ({ db: { update: vi.fn() } }));

import { cancelBookOrder } from '../book-order';

describe('cancelBookOrder', () => {
	it('rejects a slip that is not an order id', async () => {
		expect(await cancelBookOrder('user-1', 'nie')).toEqual({
			ok: false,
			message: 'Objednávka sa nenašla.'
		});
	});
});
