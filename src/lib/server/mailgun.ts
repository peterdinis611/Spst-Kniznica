import { env } from '$env/dynamic/private';

const invited = new Set<string>();

function envText(value: string | undefined) {
	return (value ?? '').trim().replace(/^['"]+|['"]+$/g, '');
}

function mailAuth(key: string) {
	return `Basic ${Buffer.from(`api:${key}`).toString('base64')}`;
}

export function mailgunReady() {
	return Boolean(envText(env.MAILGUN_API_KEY) && envText(env.MAILGUN_DOMAIN));
}

function unauthorizedSandbox(body: string) {
	return /authorized recipient/i.test(body) || /sandbox subdomains are for test/i.test(body);
}

async function inviteSandboxRecipient(base: string, key: string, email: string) {
	const to = email.trim().toLowerCase();
	if (!to || invited.has(to)) return;
	invited.add(to);

	try {
		await fetch(`${base}/v5/sandbox/auth_recipients?email=${encodeURIComponent(to)}`, {
			method: 'POST',
			headers: { Authorization: mailAuth(key) }
		});
	} catch {
		invited.delete(to);
	}
}

export async function sendMailgun(input: {
	to: string;
	toName?: string;
	subject: string;
	text: string;
	html: string;
}): Promise<{ ok: true } | { ok: false; skipped: boolean }> {
	const key = envText(env.MAILGUN_API_KEY);
	const domain = envText(env.MAILGUN_DOMAIN);
	const to = input.to.trim();
	if (!key || !domain || !to) return { ok: false, skipped: true };

	const from = envText(env.MAILGUN_FROM) || `SPŠT knižnica <postmaster@${domain}>`;
	const base = (envText(env.MAILGUN_API_URL) || 'https://api.mailgun.net').replace(/\/$/, '');
	const recipient = input.toName?.trim() ? `${input.toName.trim()} <${to}>` : to;
	const body = new URLSearchParams({
		from,
		to: recipient,
		subject: input.subject,
		text: input.text,
		html: input.html
	});

	try {
		const response = await fetch(`${base}/v3/${domain}/messages`, {
			method: 'POST',
			headers: {
				Authorization: mailAuth(key),
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body
		});
		if (response.ok) return { ok: true };

		const detail = (await response.text()).slice(0, 280);
		if (domain.startsWith('sandbox') && unauthorizedSandbox(detail)) {
			await inviteSandboxRecipient(base, key, to);
			console.warn(
				`[mailgun] sandbox nedoručí na ${to}, kým Mailgun overovací odkaz v schránke nepotvrdíš.`
			);
		} else {
			console.warn(`[mailgun] ${response.status} ${detail}`);
		}

		return { ok: false, skipped: false };
	} catch (cause) {
		console.warn('[mailgun] sieť', cause instanceof Error ? cause.message : 'chyba');
		return { ok: false, skipped: false };
	}
}
