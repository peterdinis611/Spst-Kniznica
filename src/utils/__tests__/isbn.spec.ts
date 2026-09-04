import { describe, expect, it } from 'vitest';
import { compactIsbn, looksLikeIsbn } from '../isbn';

describe('compactIsbn', () => {
	it('keeps digits and an ISBN-10 X', () => {
		expect(compactIsbn('978-80-123-4501-1')).toBe('9788012345011');
		expect(compactIsbn(' 0-306-40615-X ')).toBe('030640615X');
		expect(looksLikeIsbn('9788012345011')).toBe(true);
		expect(looksLikeIsbn('97880')).toBe(false);
	});
});
