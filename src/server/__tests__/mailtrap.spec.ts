import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({
	MAILTRAP_TOKEN: 'token-test',
	MAILTRAP_FROM: 'SPŠT knižnica <hello@demomailtrap.co>',
	MAILTRAP_API_URL: 'https://send.api.mailtrap.io/api/send',
	MAILTRAP_TO: ''
}));

vi.mock('@/config/env', () => ({ env }));

import { sendMailtrap } from '../mailtrap';

const slip = {
	toName: 'Peter Dinis',
	subject: 'Vypožičané',
	text: 'Lístok.',
	html: '<p>Lístok.</p>'
};

describe('sendMailtrap', () => {
	beforeEach(() => {
		env.MAILTRAP_TO = '';
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('{"success":true}', { status: 200 }))
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('posts a message to Mailtrap sending API', async () => {
		const result = await sendMailtrap({ to: 'peter@spst.sk', ...slip });

		expect(result).toEqual({ ok: true });
		expect(fetch).toHaveBeenCalledWith(
			'https://send.api.mailtrap.io/api/send',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					Authorization: 'Bearer token-test'
				})
			})
		);

		const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(body.from).toEqual({ email: 'hello@demomailtrap.co', name: 'SPŠT knižnica' });
		expect(body.to).toEqual([{ email: 'peter@spst.sk', name: 'Peter Dinis' }]);
	});

	it('diverts a demo-domain slip to the Mailtrap account owner', async () => {
		env.MAILTRAP_TO = 'peterdinis611@gmail.com';

		await sendMailtrap({ to: 'pdinis1@gmail.com', ...slip });

		const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(body.to).toEqual([{ email: 'peterdinis611@gmail.com', name: 'Peter Dinis' }]);
		expect(body.text).toContain('Pôvodný preukaz: pdinis1@gmail.com');
	});
});
