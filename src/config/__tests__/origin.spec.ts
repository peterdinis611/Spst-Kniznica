import { afterEach, describe, expect, it, vi } from 'vitest';

const { env, runtime } = vi.hoisted(() => ({
	env: { ORIGIN: '' as string | undefined },
	runtime: { dev: true, building: false }
}));

vi.mock('@/config/env', () => ({ env }));
vi.mock('@/config/runtime', () => runtime);

import { originIsSet, siteOrigin } from '../origin';

describe('siteOrigin', () => {
	afterEach(() => {
		env.ORIGIN = '';
		runtime.dev = true;
		runtime.building = false;
	});

	it('trims a trailing slash', () => {
		env.ORIGIN = 'https://kniznica.example.sk/';
		expect(siteOrigin()).toBe('https://kniznica.example.sk');
		expect(originIsSet()).toBe(true);
	});

	it('falls back to localhost in next dev', () => {
		expect(siteOrigin()).toBe('http://localhost:3000');
	});

	it('throws in production when ORIGIN is missing', () => {
		runtime.dev = false;
		runtime.building = false;
		expect(() => siteOrigin()).toThrow(/ORIGIN chýba/);
	});
});
