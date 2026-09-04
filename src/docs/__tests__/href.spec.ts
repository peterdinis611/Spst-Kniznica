import { describe, expect, it } from 'vitest';
import { docsHref } from '../href';

describe('docsHref', () => {
	it('keeps the handbook root and nested chapters', () => {
		expect(docsHref('/docs')).toBe('/docs');
		expect(docsHref('/docs/')).toBe('/docs');
		expect(docsHref('/docs/pult')).toBe('/docs/pult');
		expect(docsHref('/docs/sprava/ucet')).toBe('/docs/sprava/ucet');
	});
});
