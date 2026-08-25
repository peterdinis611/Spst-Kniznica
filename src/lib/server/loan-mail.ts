import { env } from '$env/dynamic/private';
import { shortDate, stampDate } from '$lib/format';
import { sendMail } from '$lib/server/mailgun';

export type LoanNotice = {
	kind: 'borrow' | 'return';
	to: string;
	readerName: string;
	bookTitle: string;
	callNumber?: string;
	dueAt?: Date | string | number | null;
	className?: string;
	days?: number;
};

function origin() {
	return (env.ORIGIN ?? '').replace(/\/$/, '') || 'http://localhost:5173';
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function chip(label: string) {
	return `<td style="padding:5px 9px;border:1px solid #d7c4ae;font-family:Courier,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5c4a3c;">${escapeHtml(label)}</td>`;
}

export function loanMailCopy(notice: LoanNotice) {
	const name = notice.readerName.trim() || 'Čitateľ';
	const title = notice.bookTitle.trim() || 'Zväzok';
	const due = notice.dueAt ? shortDate(notice.dueAt) : '';
	const dueStamp = notice.dueAt ? stampDate(notice.dueAt) : '';
	const loansHref = `${origin()}/loans`;
	const hallHref = `${origin()}/books`;

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

function slipHtml(input: {
	kicker: string;
	heading: string;
	body: string;
	chips: (string | null | undefined)[];
	ctaHref: string;
	cta: string;
	foot: string;
}) {
	const chips = input.chips.filter((item): item is string => Boolean(item?.trim()));
	const chipRow = chips
		.map((item, i) => `${i ? '<td width="8"></td>' : ''}${chip(item)}`)
		.join('');

	return `<!doctype html>
<html lang="sk">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<meta name="color-scheme" content="light" />
		<title>${escapeHtml(input.heading)}</title>
	</head>
	<body style="margin:0;padding:0;background:#f6f0e6;">
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f0e6;">
			<tr>
				<td align="center" style="padding:32px 16px 40px;">
					<p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#7a6554;">
						SPŠT knižnica · pavilón B
					</p>
					<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fff8ee;border:1px solid #d7c4ae;">
						<tr>
							<td width="8" style="background:#c45a38;font-size:0;line-height:0;">&nbsp;</td>
							<td width="28" valign="top" style="background:#fff8ee;padding:22px 0 0;font-size:0;">
								<table role="presentation" cellpadding="0" cellspacing="0" align="center">
									<tr><td style="width:14px;height:14px;background:#f6f0e6;border:1px solid #d7c4ae;border-radius:999px;font-size:0;line-height:0;">&nbsp;</td></tr>
									<tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>
									<tr><td style="width:14px;height:14px;background:#f6f0e6;border:1px solid #d7c4ae;border-radius:999px;font-size:0;line-height:0;">&nbsp;</td></tr>
									<tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>
									<tr><td style="width:14px;height:14px;background:#f6f0e6;border:1px solid #d7c4ae;border-radius:999px;font-size:0;line-height:0;">&nbsp;</td></tr>
									<tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>
									<tr><td style="width:14px;height:14px;background:#f6f0e6;border:1px solid #d7c4ae;border-radius:999px;font-size:0;line-height:0;">&nbsp;</td></tr>
								</table>
							</td>
							<td style="padding:26px 28px 22px 8px;font-family:Georgia,'Times New Roman',serif;color:#2c1d16;">
								<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
									<tr>
										<td style="font-family:Courier,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7a6554;">
											${escapeHtml(input.kicker)}
										</td>
										<td align="right" style="width:64px;">
											<span style="display:inline-block;padding:6px 9px 5px;border:2px solid #c45a38;border-radius:999px;color:#c45a38;font-size:12px;font-style:italic;font-weight:700;letter-spacing:0.14em;">SPŠT</span>
										</td>
									</tr>
								</table>
								<h1 style="margin:18px 0 0;font-size:34px;line-height:0.98;letter-spacing:-0.03em;font-weight:700;">
									${escapeHtml(input.heading)}
								</h1>
								<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									${input.body}
								</p>
								<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 0;">
									<tr>${chipRow}</tr>
								</table>
								<p style="margin:24px 0 0;">
									<a href="${escapeHtml(input.ctaHref)}" style="display:inline-block;padding:14px 22px;background:#3c2a21;color:#fff8ee;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;text-decoration:none;">
										${escapeHtml(input.cta)}
									</a>
								</p>
								<p style="margin:16px 0 0;font-size:14px;line-height:1.45;color:#7a6554;">
									${escapeHtml(input.foot)}
								</p>
								<p style="margin:22px 0 0;font-family:Courier,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#7a6554;">
									preukaz · pav. B · po–pia 7:30–15:30
								</p>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
</html>`;
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
