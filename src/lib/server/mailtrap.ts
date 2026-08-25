import { env } from '$env/dynamic/private';

function envText(value: string | undefined) {
	return (value ?? '').trim().replace(/^['"]+|['"]+$/g, '');
}

export function parseFrom(raw: string, fallbackEmail: string, fallbackName: string) {
	const value = envText(raw);
	const match = value.match(/^(.*)<([^>]+)>$/);
	if (match) {
		const name = match[1].trim().replace(/^['"]+|['"]+$/g, '') || fallbackName;
		return { email: match[2].trim(), name };
	}
	if (value.includes('@')) return { email: value, name: fallbackName };
	return { email: fallbackEmail, name: fallbackName };
}

export function mailtrapReady() {
	return Boolean(envText(env.MAILTRAP_TOKEN) || envText(env.MAILTRAP_API_KEY));
}

function isDemoFrom(email: string) {
	return email.toLowerCase().endsWith('@demomailtrap.co');
}

function divertTo(to: string) {
	const owner = envText(env.MAILTRAP_TO);
	if (!owner || owner.toLowerCase() === to.toLowerCase()) {
		return { email: to, original: null as string | null };
	}
	return { email: owner, original: to };
}

export async function sendMailtrap(input: {
	to: string;
	toName?: string;
	subject: string;
	text: string;
	html: string;
}): Promise<{ ok: true } | { ok: false; skipped: boolean }> {
	const token = envText(env.MAILTRAP_TOKEN) || envText(env.MAILTRAP_API_KEY);
	const to = input.to.trim();
	if (!token || !to) return { ok: false, skipped: true };

	const from = parseFrom(
		env.MAILTRAP_FROM ?? '',
		'hello@demomailtrap.co',
		'SPŠT knižnica'
	);
	const endpoint =
		envText(env.MAILTRAP_API_URL) || 'https://send.api.mailtrap.io/api/send';
	const diverted = isDemoFrom(from.email) ? divertTo(to) : { email: to, original: null };
	const toEntry = input.toName?.trim()
		? { email: diverted.email, name: input.toName.trim() }
		: { email: diverted.email };
	const note = diverted.original ? `Pôvodný preukaz: ${diverted.original}\n\n` : '';
	const htmlNote = diverted.original
		? `<p style="margin:0 0 14px;font-family:Courier,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#7a6554;">Pôvodný preukaz · ${diverted.original}</p>`
		: '';

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
				'User-Agent': 'SPST-kniznica'
			},
			body: JSON.stringify({
				from,
				to: [toEntry],
				subject: input.subject,
				text: `${note}${input.text}`,
				html: `${htmlNote}${input.html}`
			})
		});
		if (response.ok) return { ok: true };

		const detail = (await response.text()).slice(0, 280);
		if (/account owners|own email address/i.test(detail)) {
			console.warn(
				'[mailtrap] demo doména doručí len na e-mail majiteľa Mailtrap účtu. Doplň MAILTRAP_TO v .env.'
			);
		} else {
			console.warn(`[mailtrap] ${response.status} ${detail}`);
		}
		return { ok: false, skipped: false };
	} catch (cause) {
		console.warn('[mailtrap] sieť', cause instanceof Error ? cause.message : 'chyba');
		return { ok: false, skipped: false };
	}
}
