import { shortDate, stampDate } from '@/utils/format';
import { HOLD_DAYS } from '@/catalog/hold';
import { sendMail } from '@/server/mail';
import { escapeHtml, mailOrigin, slipHtml } from '@/server/mail-slip';
import type { HoldOffer } from './waitlist';

export type HoldNotice = {
	kind: 'queued' | 'ready' | 'expireSoon' | 'expired' | 'cancelled';
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

	if (notice.kind === 'expireSoon') {
		const subject = `Zajtra vyprší lístok · ${title} · SPŠT knižnica`;
		const text = [
			`${name}, lístok na ${title} na pulte vyprší zajtra.`,
			due ? `Vyzdvihni ho do ${due} v pavilóne B.` : 'Vyzdvihni ho zajtra v pavilóne B.',
			notice.callNumber ? `Signatúra: ${notice.callNumber}` : '',
			`Lístok: ${loansHref}`
		]
			.filter(Boolean)
			.join('\n');
		const html = slipHtml({
			kicker: 'lístok na pulte',
			heading: 'Zajtra vyprší.',
			body: `${escapeHtml(name)}, <strong>${escapeHtml(title)}</strong> ešte drží pavilón B. Požičaj ho z karty, kým lístok platí — potom ide ďalšiemu v rade.`,
			chips: [notice.callNumber || null, dueStamp ? `do ${dueStamp}` : 'zajtra', 'pavilón B'],
			ctaHref: loansHref,
			cta: 'Otvoriť Moje knihy',
			foot: 'Ak lístok vyprší, zväzok prejde na ďalšieho. Môžeš si ho znova dať do radu.'
		});
		return { subject, text, html };
	}

	if (notice.kind === 'expired') {
		const subject = `Lístok vypršal · ${title} · SPŠT knižnica`;
		const text = [
			`${name}, lístok na ${title} na pulte vypršal.`,
			'Zväzok šiel ďalšiemu v rade, alebo spätne na policu.',
			notice.callNumber ? `Signatúra: ${notice.callNumber}` : '',
			'Príď do pavilónu B, alebo si ho znova daj do radu z karty.',
			`Lístok: ${loansHref}`
		]
			.filter(Boolean)
			.join('\n');
		const html = slipHtml({
			kicker: 'lístok vypršal',
			heading: 'Vypršalo.',
			body: `${escapeHtml(name)}, sedem dní na <strong>${escapeHtml(title)}</strong> prešlo. Výtlačok šiel ďalej. Ak ho ešte chceš, daj si ho znova do radu na karte, alebo sa opýtaj na pulte.`,
			chips: [notice.callNumber || null, dueStamp ? `do ${dueStamp}` : null, 'pavilón B'],
			ctaHref: loansHref,
			cta: 'Otvoriť Moje knihy',
			foot: 'Lístok na pulte drží sedem dní. Ďalší v rade dostane svoj list zvlášť.'
		});
		return { subject, text, html };
	}

	if (notice.kind === 'cancelled') {
		const subject = `Rad zrušený · ${title} · SPŠT knižnica`;
		const text = [
			`${name}, čakací lístok na ${title} pult zrušil.`,
			notice.callNumber ? `Signatúra: ${notice.callNumber}` : '',
			'Ak ho ešte chceš, daj si ho znova do radu z karty.',
			`Lístok: ${loansHref}`
		]
			.filter(Boolean)
			.join('\n');
		const html = slipHtml({
			kicker: 'rad z pultu',
			heading: 'Zrušené.',
			body: `${escapeHtml(name)}, lístok na <strong>${escapeHtml(title)}</strong> už v rade nie je. Zväzok ostáva vo fonde — z karty si ho môžeš znova rezervovať, ak je vonku.`,
			chips: [notice.callNumber || null, 'pavilón B'],
			ctaHref: loansHref,
			cta: 'Otvoriť Moje knihy',
			foot: 'Zmenu spravil pult v pavilóne B. Nie je to pokuta.'
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
		chips: [
			notice.callNumber || null,
			dueStamp ? `do ${dueStamp}` : `${HOLD_DAYS} dní`,
			'pavilón B'
		],
		ctaHref: loansHref,
		cta: 'Otvoriť Moje knihy',
		foot: 'Ak lístok vyprší, zväzok prejde na ďalšieho v rade.'
	});
	return { subject, text, html };
}

export async function sendHoldNotice(notice: HoldNotice) {
	if (!notice.to.trim()) return { ok: false as const, skipped: true };
	const copy = holdMailCopy(notice);
	return sendMail({
		to: notice.to,
		toName: notice.readerName,
		...copy
	});
}

export async function queueHoldNotice(notice: HoldNotice) {
	if (!notice.to.trim()) return { ok: false as const, skipped: true };
	const { enqueueFolioMail } = await import('@/server/boss');
	return enqueueFolioMail({ kind: 'hold', notice });
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

export async function notifyHoldExpired(
	lapse: {
		email: string;
		name: string;
		bookTitle: string;
		callNumber: string;
	} | null
) {
	if (!lapse?.email) return;
	await queueHoldNotice({
		kind: 'expired',
		to: lapse.email,
		readerName: lapse.name,
		bookTitle: lapse.bookTitle,
		callNumber: lapse.callNumber
	});
}
