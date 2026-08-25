import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { mailgunReady, sendMailgun } from '$lib/server/mailgun';
import { mailtrapReady, sendMailtrap } from '$lib/server/mailtrap';

function envText(value: string | undefined) {
	return (value ?? '').trim().replace(/^['"]+|['"]+$/g, '').toLowerCase();
}

export type MailDriver = 'mailtrap' | 'mailgun';

export function mailDriver(): MailDriver {
	const forced = envText(env.MAIL_DRIVER);
	if (forced === 'mailtrap' || forced === 'mailgun') return forced;
	return dev ? 'mailtrap' : 'mailgun';
}

export function mailReady() {
	return mailDriver() === 'mailtrap' ? mailtrapReady() : mailgunReady();
}

export async function sendMail(input: {
	to: string;
	toName?: string;
	subject: string;
	text: string;
	html: string;
}): Promise<{ ok: true } | { ok: false; skipped: boolean }> {
	const driver = mailDriver();

	if (driver === 'mailtrap') {
		if (!mailtrapReady()) {
			console.warn('[mail] Mailtrap token chýba, lístok v teste neide.');
			return { ok: false, skipped: true };
		}
		return sendMailtrap(input);
	}

	if (!mailgunReady()) {
		console.warn('[mail] Mailgun kľúč chýba, lístok v produkcii neide.');
		return { ok: false, skipped: true };
	}
	return sendMailgun(input);
}
