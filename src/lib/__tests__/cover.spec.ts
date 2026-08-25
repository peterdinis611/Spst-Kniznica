import { describe, expect, it } from 'vitest';
import { jacketFor } from '../cover';

describe('jacketFor', () => {
	it('keeps the hashed cloth when the volume has no cover', () => {
		const first = jacketFor({ id: 'book-algo', title: 'Algoritmy' });
		const again = jacketFor({ id: 'book-algo', title: 'Algoritmy', coverUrl: null });
		expect(again.photo).toBe(first.photo);
		expect(again.photo).toContain('unsplash.com');
	});

	it('puts a stored cover on the same cloth', () => {
		const hashed = jacketFor({ id: 'book-algo', title: 'Algoritmy' });
		const jacket = jacketFor({
			id: 'book-algo',
			title: 'Algoritmy',
			coverUrl: 'https://ufs.sh/f/jacket'
		});
		expect(jacket.photo).toBe('https://ufs.sh/f/jacket');
		expect(jacket.bg).toBe(hashed.bg);
		expect(jacket.ink).toBe(hashed.ink);
	});
});
