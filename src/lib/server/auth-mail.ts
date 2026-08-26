import { sendMail } from '$lib/server/mail';
import { escapeHtml, slipHtml } from '$lib/server/mail-slip';

export type RecoveryLetter = {
	to: string;
	name?: string;
	href: string;
	code?: string | null;
};

export type PasswordChangedLetter = {
	to: string;
	name?: string;
	profileHref: string;
};

export function recoveryMailCopy(letter: RecoveryLetter) {
	const name = letter.name?.trim() || 'Čitateľ';
	const subject = 'Nové heslo · SPŠT knižnica';
	const text = [
		`${name}, prišla žiadosť o obnovu hesla k preukazu.`,
		'Odkaz platí krátko a použiješ ho raz. Heslo na pulte nehlásime.',
		letter.href,
		letter.code ? `Kód, ak odkaz nefunguje: ${letter.code}` : '',
		'Ak si o obnovu nežiadal, tento list zahoď.'
	]
		.filter(Boolean)
		.join('\n');
	const html = slipHtml({
		kicker: 'obnova hesla',
		heading: 'Nastav nové heslo.',
		body: `${escapeHtml(name)}, prišla žiadosť o obnovu preukazu. Odkaz platí krátko a použiješ ho raz.`,
		chips: ['raz', 'krátko', 'pavilón B'],
		ctaHref: letter.href,
		cta: 'Nastaviť heslo',
		foot: 'Ak si o obnovu nežiadal, tento list zahoď. Účet ostane ako bol.',
		code: letter.code
	});
	return { subject, text, html };
}

export function passwordChangedMailCopy(letter: PasswordChangedLetter) {
	const name = letter.name?.trim() || 'Čitateľ';
	const subject = 'Heslo je nové · SPŠT knižnica';
	const text = [
		`${name}, heslo k čitateľskému preukazu je nové.`,
		'Ak si ho nemenil, napíš na pult — obnovíme prístup odkazom z pošty.',
		`Preukaz: ${letter.profileHref}`
	].join('\n');
	const html = slipHtml({
		kicker: 'pečiatka hesla',
		heading: 'Heslo je nové.',
		body: `${escapeHtml(name)}, odtlačok na preukaze sa zmenil. Výpožičky ostávajú, prihlasuješ sa novým heslom.`,
		chips: ['preukaz', 'pavilón B'],
		ctaHref: letter.profileHref,
		cta: 'Otvoriť preukaz',
		foot: 'Ak si heslo nemenil ty, napíš na pult. Odkaz z tohto listu heslo neresetuje.'
	});
	return { subject, text, html };
}

export async function sendRecoveryLetter(letter: RecoveryLetter) {
	if (!letter.to.trim() || !letter.href.trim()) return { ok: false as const, skipped: true };
	return sendMail({
		to: letter.to,
		toName: letter.name,
		...recoveryMailCopy(letter)
	});
}

export async function sendPasswordChangedLetter(letter: PasswordChangedLetter) {
	if (!letter.to.trim()) return { ok: false as const, skipped: true };
	return sendMail({
		to: letter.to,
		toName: letter.name,
		...passwordChangedMailCopy(letter)
	});
}
