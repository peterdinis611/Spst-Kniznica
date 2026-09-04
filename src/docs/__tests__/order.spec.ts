import { describe, expect, it } from 'vitest';
import { sortDocChapters } from '../order';

describe('sortDocChapters', () => {
	it('orders by the front-matter number, then the Slovak title', () => {
		const sorted = sortDocChapters([
			{ url: '/docs/zataz', data: { order: 10, title: 'Záťaž' } },
			{ url: '/docs/sprava', data: { order: 8, title: 'Správa' } },
			{ url: '/docs/otazky', data: { order: 9, title: 'Časté otázky' } },
			{ url: '/docs/volna', data: { title: 'Bez poradia' } }
		]);

		expect(sorted.map((item) => item.url)).toEqual([
			'/docs/sprava',
			'/docs/otazky',
			'/docs/zataz',
			'/docs/volna'
		]);
	});
});
