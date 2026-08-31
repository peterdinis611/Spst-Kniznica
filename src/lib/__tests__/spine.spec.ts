import { describe, expect, it } from 'vitest';
import { spineLines } from '../spine';

describe('spineLines', () => {
	it('stacks a call number the way it sits on the book', () => {
		expect(spineLines('INF 004.4 BEL')).toEqual(['INF', '004.4', 'BEL']);
		expect(spineLines('  STR 621  ')).toEqual(['STR', '621']);
	});
});
