import { describe, expect, it, vi } from 'vitest';
import { docsHref } from '../docs/href';

vi.mock('$app/paths', () => ({
	resolve: (route: string, params?: Record<string, string>) =>
		route === '/docs/[...slug]' ? `/docs/${params?.slug ?? ''}` : route
}));

describe('docsHref', () => {
	it('keeps the handbook root and nested chapters', () => {
		expect(docsHref('/docs')).toBe('/docs');
		expect(docsHref('/docs/')).toBe('/docs');
		expect(docsHref('/docs/pult')).toBe('/docs/pult');
		expect(docsHref('/docs/sprava/ucet')).toBe('/docs/sprava/ucet');
	});
});
