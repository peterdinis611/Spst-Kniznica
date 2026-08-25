import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: {
		MAILGUN_API_KEY: 'key-test',
		MAILGUN_DOMAIN: 'sandbox.mailgun.org',
		MAILGUN_FROM: 'SPŠT knižnica <postmaster@sandbox.mailgun.org>',
		MAILGUN_API_URL: 'https://api.mailgun.net'
	}
}));

import { sendMailgun } from '../mailgun';

const slip = {
	toName: 'Peter Dinis',
	subject: 'Vypožičané',
	text: 'Lístok.',
	html: '<p>Lístok.</p>'
};

describe('sendMailgun', () => {
	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('{"id":"<ok>"}', { status: 200 }))
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('posts a message to Mailgun', async () => {
		const result = await sendMailgun({ to: 'peter@spst.sk', ...slip });

		expect(result).toEqual({ ok: true });
		expect(fetch).toHaveBeenCalledWith(
			'https://api.mailgun.net/v3/sandbox.mailgun.org/messages',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('invites a sandbox recipient when Mailgun refuses the address', async () => {
		vi.mocked(fetch).mockImplementation(async (url) => {
			if (String(url).includes('auth_recipients')) {
				return new Response('{"recipient":{"activated":false}}', { status: 200 });
			}
			return new Response(
				'Sandbox subdomains are for test purposes only. Please add your own domain or add the address to authorized recipients table',
				{ status: 400 }
			);
		});
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const result = await sendMailgun({ to: 'pdinis1@gmail.com', ...slip });

		expect(result).toEqual({ ok: false, skipped: false });
		expect(fetch).toHaveBeenCalledWith(
			'https://api.mailgun.net/v5/sandbox/auth_recipients?email=pdinis1%40gmail.com',
			expect.objectContaining({ method: 'POST' })
		);
		warn.mockRestore();
	});
});
