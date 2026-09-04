import { beforeEach, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({
	MAIL_DRIVER: '',
	MAILTRAP_TOKEN: 'token-test',
	MAILGUN_API_KEY: 'key-test',
	MAILGUN_DOMAIN: 'sandbox.mailgun.org'
}));

vi.mock('@/config/runtime', () => ({
	dev: true,
	browser: false,
	building: false
}));

vi.mock('@/config/env', () => ({ env }));

vi.mock('../mailtrap', () => ({
	mailtrapReady: () => true,
	sendMailtrap: vi.fn(async () => ({ ok: true }))
}));

vi.mock('../mailgun', () => ({
	mailgunReady: () => true,
	sendMailgun: vi.fn(async () => ({ ok: true }))
}));

import { mailDriver, sendMail } from '../mail';
import { sendMailgun } from '../mailgun';
import { sendMailtrap } from '../mailtrap';

const slip = {
	to: 'peter@spst.sk',
	subject: 'Vypožičané',
	text: 'Lístok.',
	html: '<p>Lístok.</p>'
};

describe('mailDriver', () => {
	it('uses Mailtrap in vite dev unless MAIL_DRIVER says otherwise', () => {
		env.MAIL_DRIVER = '';
		expect(mailDriver()).toBe('mailtrap');
	});

	it('honours MAIL_DRIVER=mailgun even in local dev', () => {
		env.MAIL_DRIVER = 'mailgun';
		expect(mailDriver()).toBe('mailgun');
	});
});

describe('sendMail', () => {
	beforeEach(() => {
		vi.mocked(sendMailtrap).mockClear();
		vi.mocked(sendMailgun).mockClear();
	});

	it('hands a local slip to Mailtrap', async () => {
		env.MAIL_DRIVER = 'mailtrap';
		await sendMail(slip);
		expect(sendMailtrap).toHaveBeenCalledWith(slip);
		expect(sendMailgun).not.toHaveBeenCalled();
	});

	it('hands a production slip to Mailgun', async () => {
		env.MAIL_DRIVER = 'mailgun';
		await sendMail(slip);
		expect(sendMailgun).toHaveBeenCalledWith(slip);
		expect(sendMailtrap).not.toHaveBeenCalled();
	});
});
