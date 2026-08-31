import { shortDate, stampDate } from '$lib/format';
import { sendMail } from '$lib/server/mail';
import { escapeHtml, mailOrigin, slipHtml } from '$lib/server/mail-slip';

export type LoanNotice = {
	kind: 'borrow' | 'return' | 'renew' | 'dueChanged' | 'dueSoon' | 'overdue';
	to: string;
	readerName: string;
	bookTitle: string;
	callNumber?: string;
	dueAt?: Date | string | number | null;
	className?: string;
	days?: number;
};

export function loanMailCopy(notice: LoanNotice) {
	const name = notice.readerName.trim() || 'Čitateľ';
	const title = notice.bookTitle.trim() || 'Zväzok';
	const due = notice.dueAt ? shortDate(notice.dueAt) : '';
	const dueStamp = notice.dueAt ? stampDate(notice.dueAt) : '';
	const loansHref = `${mailOrigin()}/loans`;
	const hallHref = `${mailOrigin()}/books`;

	if (notice.kind === 'borrow') {
		const subject = `Vypožičané · ${title} · SPŠT knižnica`;
		const text = [
			`${name}, zväzok ${title} je na tvojom preukaze.`,
			due ? `Vráť ho do ${due} (pavilón B, 1. poschodie, po–pia 7:30–15:30).` : 'Vráť ho v pavilóne B.',
			notice.callNumber ? `Signatúra: ${notice.callNumber}` : '',
			notice.className ? `Trieda: ${notice.className}` : '',
			notice.days ? `Doba: ${notice.days} dní` : '',
			`Lístok: ${loansHref}`
		]
			.filter(Boolean)
			.join('\n');
		const html = slipHtml({
			kicker: 'výpožičný lístok',
			heading: 'Vypožičané.',
			body: `${escapeHtml(name)}, <strong>${escapeHtml(title)}</strong> je na preukaze. Výtlačok vyzdvihni na pulte a vráť ho v pavilóne B.`,
			chips: [
				notice.callNumber || null,
				dueStamp ? `do ${dueStamp}` : null,
				notice.days ? `${notice.days} dní` : null,
				'pavilón B'
			],
			ctaHref: loansHref,
			cta: 'Otvoriť Moje knihy',
			foot: 'List je pečiatka pohybu, nie pokuta. Papierový výtlačok ostáva rozhodujúci.'
		});
		return { subject, text, html };
	}

	if (notice.kind === 'renew') {
		const subject = `Predĺžené · ${title} · SPŠT knižnica`;
		const text = [
			`${name}, výpožička ${title} je predĺžená.`,
			due ? `Nový termín: ${due}.` : 'Nový termín je na lístku.',
			notice.callNumber ? `Signatúra: ${notice.callNumber}` : '',
			`Lístok: ${loansHref}`
		]
			.filter(Boolean)
			.join('\n');
		const html = slipHtml({
			kicker: 'predĺženie lístka',
			heading: 'Predĺžené.',
			body: `${escapeHtml(name)}, <strong>${escapeHtml(title)}</strong> ostáva na preukaze. Ďalšie predĺženie z lístka už nejde.`,
			chips: [notice.callNumber || null, dueStamp ? `do ${dueStamp}` : null, 'pavilón B'],
			ctaHref: loansHref,
			cta: 'Otvoriť Moje knihy',
			foot: 'Predĺženie je raz. Ak na zväzok čaká iný čitateľ, lístok sa nepredĺži.'
		});
		return { subject, text, html };
	}

	if (notice.kind === 'dueChanged') {
		const subject = `Nový termín · ${title} · SPŠT knižnica`;
		const text = [
			`${name}, pult opravil termín výpožičky ${title}.`,
			due ? `Nový termín: ${due}.` : 'Nový termín je na lístku.',
			notice.callNumber ? `Signatúra: ${notice.callNumber}` : '',
			`Lístok: ${loansHref}`
		]
			.filter(Boolean)
			.join('\n');
		const html = slipHtml({
			kicker: 'termín z pultu',
			heading: 'Nový termín.',
			body: `${escapeHtml(name)}, knihovník na pulte zmenil lehotu na <strong>${escapeHtml(title)}</strong>. Vráť zväzok v pavilóne B do nového dátumu.`,
			chips: [notice.callNumber || null, dueStamp ? `do ${dueStamp}` : null, 'pavilón B'],
			ctaHref: loansHref,
			cta: 'Otvoriť Moje knihy',
			foot: 'Toto nie je predĺženie z lístka. Papierový výtlačok ostáva rozhodujúci.'
		});
		return { subject, text, html };
	}

	if (notice.kind === 'dueSoon') {
		const subject = `Zajtra splatné · ${title} · SPŠT knižnica`;
		const text = [
			`${name}, zväzok ${title} je zajtra splatný.`,
			due ? `Vráť ho do ${due} v pavilóne B.` : 'Vráť ho zajtra v pavilóne B.',
			notice.callNumber ? `Signatúra: ${notice.callNumber}` : '',
			`Lístok: ${loansHref}`
		]
			.filter(Boolean)
			.join('\n');
		const html = slipHtml({
			kicker: 'termín na lístku',
			heading: 'Zajtra splatné.',
			body: `${escapeHtml(name)}, <strong>${escapeHtml(title)}</strong> treba vrátiť zajtra. Pavilón B, 1. poschodie, po–pia 7:30–15:30.`,
			chips: [notice.callNumber || null, dueStamp ? `do ${dueStamp}` : 'zajtra', 'pavilón B'],
			ctaHref: loansHref,
			cta: 'Otvoriť Moje knihy',
			foot: 'List je dohoda, nie pokuta. Papierový výtlačok ostáva rozhodujúci.'
		});
		return { subject, text, html };
	}

	if (notice.kind === 'overdue') {
		const subject = `Po lehote · ${title} · SPŠT knižnica`;
		const text = [
			`${name}, zväzok ${title} je po lehote.`,
			due ? `Termín bol ${due}.` : '',
			'Dones ho do pavilónu B, 1. poschodie.',
			notice.callNumber ? `Signatúra: ${notice.callNumber}` : '',
			`Lístok: ${loansHref}`
		]
			.filter(Boolean)
			.join('\n');
		const html = slipHtml({
			kicker: 'lístok po lehote',
			heading: 'Po lehote.',
			body: `${escapeHtml(name)}, <strong>${escapeHtml(title)}</strong> mal byť vo fonde. Dones výtlačok do pavilónu B — v aplikácii poplatok nie je.`,
			chips: [notice.callNumber || null, dueStamp ? `bolo ${dueStamp}` : null, 'pavilón B'],
			ctaHref: loansHref,
			cta: 'Otvoriť Moje knihy',
			foot: 'Oneskorenie rieši pult. Pečiatka nie je pokuta.'
		});
		return { subject, text, html };
	}

	const subject = `Vrátené · ${title} · SPŠT knižnica`;
	const text = [
		`${name}, zväzok ${title} je spätne vo fonde.`,
		notice.callNumber ? `Signatúra: ${notice.callNumber}` : '',
		`Katalóg: ${hallHref}`
	]
		.filter(Boolean)
		.join('\n');
	const html = slipHtml({
		kicker: 'vrátenie do fondu',
		heading: 'Vrátené.',
		body: `${escapeHtml(name)}, <strong>${escapeHtml(title)}</strong> je spätne na polici. Ďalší zväzok si môžeš vziať hneď.`,
		chips: [notice.callNumber || null, stampDate(new Date()), 'pavilón B'],
		ctaHref: hallHref,
		cta: 'Do katalógu',
		foot: 'Pečiatka padla. Výtlačok je voľný pre ďalšieho čitateľa.'
	});
	return { subject, text, html };
}

export function queueLoanNotice(notice: LoanNotice) {
	return sendLoanNotice(notice);
}

export async function sendLoanNotice(notice: LoanNotice) {
	if (!notice.to.trim()) return { ok: false as const, skipped: true };
	const copy = loanMailCopy(notice);
	return sendMail({
		to: notice.to,
		toName: notice.readerName,
		...copy
	});
}
