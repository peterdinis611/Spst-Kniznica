import { describe, expect, it } from 'vitest';
import { parseCover } from '../cover-files';

describe('parseCover', () => {
	it('clears an empty slip', () => {
		expect(parseCover('  ', 'abc')).toEqual({ coverUrl: null, coverKey: null });
	});

	it('keeps an https jacket and optional key', () => {
		expect(parseCover('https://ufs.sh/f/jacket', ' jacket ')).toEqual({
			coverUrl: 'https://ufs.sh/f/jacket',
			coverKey: 'jacket'
		});
		expect(parseCover('https://ufs.sh/f/jacket', '')).toEqual({
			coverUrl: 'https://ufs.sh/f/jacket',
			coverKey: null
		});
	});

	it('rejects a non-http address', () => {
		expect(parseCover('javascript:alert(1)', 'x')).toEqual({ coverUrl: null, coverKey: null });
		expect(parseCover('not-a-url', 'x')).toEqual({ coverUrl: null, coverKey: null });
	});
});
