import { afterEach, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({
	PUBLIC_SUPABASE_URL: '',
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
	PUBLIC_SUPABASE_ANON_KEY: ''
}));

vi.mock('$env/dynamic/public', () => ({ env }));

import { supabasePublic } from '../config';

describe('supabasePublic', () => {
	afterEach(() => {
		env.PUBLIC_SUPABASE_URL = '';
		env.PUBLIC_SUPABASE_PUBLISHABLE_KEY = '';
		env.PUBLIC_SUPABASE_ANON_KEY = '';
	});

	it('is off when the hall keys are missing', () => {
		expect(supabasePublic()).toEqual({ url: '', key: '', configured: false });
	});

	it('prefers the publishable key', () => {
		env.PUBLIC_SUPABASE_URL = ' https://spst.supabase.co ';
		env.PUBLIC_SUPABASE_PUBLISHABLE_KEY = ' pub-key ';
		env.PUBLIC_SUPABASE_ANON_KEY = 'anon-old';

		expect(supabasePublic()).toEqual({
			url: 'https://spst.supabase.co',
			key: 'pub-key',
			configured: true
		});
	});

	it('falls back to the anon key', () => {
		env.PUBLIC_SUPABASE_URL = 'https://spst.supabase.co';
		env.PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

		expect(supabasePublic().key).toBe('anon-key');
		expect(supabasePublic().configured).toBe(true);
	});
});
