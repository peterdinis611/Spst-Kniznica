import { shortDate, stampDate } from '$lib/format';
import { HOLD_DAYS } from '$lib/hold';
import { sendMail } from '$lib/server/mail';
import { escapeHtml, mailOrigin, slipHtml } from '$lib/server/mail-slip';
import type { HoldOffer } from './waitlist';

export type HoldNotice = {
	kind: 'queued' | 'ready';
	to: string;
	readerName: string;
	bookTitle: string;
	callNumber?: string;
	place?: number;
	expiresAt?: Date | string | number | null;
};

export function holdMailCopy(notice: HoldNotice) {
	const name = notice.readerName.trim() || 'Čitateľ';
	const title = notice.bookTitle.trim() || 'Zväzok';
	const loansHref = `${mailOrigin()}/loans`;
	const due = notice.expiresAt ? shortDate(notice.expiresAt) : '';
	const dueStamp = notice.expiresAt ? stampDate(notice.expiresAt) : '';

	if (notice.kind === 'queued') {
		const place = notice.place && notice.place > 0 ? `${notice.place}. v rade` : 'v rade';
		const subject = `Čakací lístok · ${title} · SPŠT knižnica`;
		const text = [
			`${name}, čakací lístok na ${title} je na pulte.`,
			place,
			notice.callNumber ? `Signatúra: ${notice.callNumber}` : '',
			`Keď sa výtlačok vráti, pošleme ďalší list.`,
			`Lístok: ${loansHref}`
		]
			.filter(Boolean)
			.join('\n');
		const html = slipHtml({
			kicker: 'čakací lístok',
			heading: 'Čakáš.',
			body: `${escapeHtml(name)}, lístok na <strong>${escapeHtml(title)}</strong> je v rade. Keď sa výtlačok vráti, ozveme sa.`,
			chips: [notice.callNumber || null, place, 'pavilón B'],
			ctaHref: loansHref,
			cta: 'Otvoriť Moje knihy',
			foot: 'Lístok drží miesto v rade. Výtlačok ostáva na pulte, kým sa nevráti.'
		});
		return { subject, text, html };
	}

	const subject = `Na pulte · ${title} · SPŠT knižnica`;
	const text = [
		`${name}, zväzok ${title} je pripravený na pulte.`,
		due ? `Vyzdvihni ho do ${due} (pavilón B, 1. poschodie).` : `Vyzdvihni ho do ${HOLD_DAYS} dní.`,
		notice.callNumber ? `Signatúra: ${notice.callNumber}` : '',
		`Lístok: ${loansHref}`
	]
		.filter(Boolean)
		.join('\n');
	const html = slipHtml({
		kicker: 'rezervácia na pulte',
		heading: 'Pripravené.',
		body: `${escapeHtml(name)}, <strong>${escapeHtml(title)}</strong> čaká v pavilóne B. Požičaj ho z karty, kým lístok platí.`,
		chips: [notice.callNumber || null, dueStamp ? `do ${dueStamp}` : `${HOLD_DAYS} dní`, 'pavilón B'],
		ctaHref: loansHref,
		cta: 'Otvoriť Moje knihy',
		foot: 'Ak lístok vyprší, zväzok prejde na ďalšieho v rade.'
	});
	return { subject, text, html };
}

export async function queueHoldNotice(notice: HoldNotice) {
	if (!notice.to.trim()) return { ok: false as const, skipped: true };
	const copy = holdMailCopy(notice);
	return sendMail({
		to: notice.to,
		toName: notice.readerName,
		...copy
	});
}

export async function notifyHoldReady(offer: HoldOffer | null) {
	if (!offer) return;
	await queueHoldNotice({
		kind: 'ready',
		to: offer.email,
		readerName: offer.name,
		bookTitle: offer.bookTitle,
		callNumber: offer.callNumber,
		expiresAt: offer.expiresAt
	});
}
