import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/runtime', () => ({
	dev: false,
	browser: false,
	building: false
}));

vi.mock('@/config/supabase', () => ({
	supabasePublic: vi.fn()
}));

vi.mock('@supabase/ssr', () => ({
	createServerClient: vi.fn()
}));

vi.mock('@/server/readers', () => ({
	readerFromClaims: vi.fn(),
	ensureLocalReader: vi.fn()
}));

import { createServerClient } from '@supabase/ssr';
import { supabasePublic } from '@/config/supabase';
import { readerFromClaims } from '@/server/readers';
import { cookiesFromHeader, deskUploader } from '../upload-auth';

const librarian = {
	id: 'user-1',
	name: 'Anna Pult',
	email: 'anna@spst.sk',
	role: 'librarian' as const
};

describe('cookiesFromHeader', () => {
	it('splits a cookie bag', () => {
		expect(cookiesFromHeader('a=1; b=two%20words')).toEqual([
			{ name: 'a', value: '1' },
			{ name: 'b', value: 'two words' }
		]);
		expect(cookiesFromHeader(null)).toEqual([]);
	});
});

describe('deskUploader', () => {
	beforeEach(() => {
		vi.mocked(supabasePublic).mockReset();
		vi.mocked(createServerClient).mockReset();
		vi.mocked(readerFromClaims).mockReset();
	});

	it('refuses a request when Auth is not configured', async () => {
		vi.mocked(supabasePublic).mockReturnValue({ url: '', key: '', configured: false });
		expect(await deskUploader(new Request('http://localhost/api/uploadthing'))).toBeNull();
	});

	it('lets a librarian through', async () => {
		vi.mocked(supabasePublic).mockReturnValue({
			url: 'https://example.supabase.co',
			key: 'pub',
			configured: true
		});
		vi.mocked(createServerClient).mockReturnValue({
			auth: {
				getClaims: async () => ({ data: { claims: { sub: librarian.id } } })
			}
		} as never);
		vi.mocked(readerFromClaims).mockResolvedValue(librarian);

		const req = new Request('http://localhost/api/uploadthing', {
			headers: { cookie: 'sb=token' }
		});
		expect(await deskUploader(req)).toEqual(librarian);
	});

	it('keeps a reader off the route in production', async () => {
		vi.mocked(supabasePublic).mockReturnValue({
			url: 'https://example.supabase.co',
			key: 'pub',
			configured: true
		});
		vi.mocked(createServerClient).mockReturnValue({
			auth: {
				getClaims: async () => ({ data: { claims: { sub: librarian.id } } })
			}
		} as never);
		vi.mocked(readerFromClaims).mockResolvedValue({ ...librarian, role: 'reader' });

		expect(await deskUploader(new Request('http://localhost/api/uploadthing'))).toBeNull();
	});
});
