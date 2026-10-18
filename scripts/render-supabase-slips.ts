/**
 * Builds cream-slip HTML for Supabase Auth (auth + security notifications).
 * Run: bun scripts/render-supabase-slips.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Slip = {
	file: string;
	title: string;
	subject: string;
	kicker: string;
	heading: string;
	/** Go-template HTML fragment(s) inside the body <p> — may include {{ if }} blocks. */
	body: string;
	chips: string[];
	cta?: { href: string; label: string };
	/** When set, shows OTP / token block. Use '{{ .Token }}' or similar. */
	code?: { label: string; value: string };
	/** Put the OTP block above the CTA (reauthentication). */
	codeFirst?: boolean;
	foot: string;
};

const OUT = join(process.cwd(), 'supabase', 'templates');

const slips: Slip[] = [
	{
		file: 'confirmation.html',
		title: 'Potvrď preukaz',
		subject: 'Potvrď preukaz · SPŠT knižnica',
		kicker: 'čitateľský preukaz',
		heading: 'Potvrď preukaz.',
		body: `{{ if .Data.name }}
								<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									{{ .Data.name }}, otvor odkaz a účet v školskom fonde začne platiť. Výpožička je 21 dní, bez stropu na počet kníh.
								</p>
								{{ else }}
								<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									Otvor odkaz a účet v školskom fonde začne platiť. Výpožička je 21 dní, bez stropu na počet kníh.
								</p>
								{{ end }}`,
		chips: ['21 dní', 'bez stropu', 'pavilón B'],
		cta: {
			href: '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email&amp;next=/loans',
			label: 'Potvrdiť preukaz'
		},
		code: { label: 'Kód, ak odkaz nefunguje', value: '{{ .Token }}' },
		foot: 'Ak si účet nezakladal, tento list zahoď. Platí pre {{ .Email }}.'
	},
	{
		file: 'invite.html',
		title: 'Pozvánka do fondu',
		subject: 'Pozvánka · SPŠT knižnica',
		kicker: 'pozvánka na preukaz',
		heading: 'Príď do fondu.',
		body: `{{ if .Data.name }}
								<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									{{ .Data.name }}, pult ťa pozval do školskej knižnice. Otvor odkaz a preukaz začne platiť. Výpožička je 21 dní, bez stropu na počet kníh.
								</p>
								{{ else }}
								<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									Pult ťa pozval do školskej knižnice. Otvor odkaz a preukaz začne platiť. Výpožička je 21 dní, bez stropu na počet kníh.
								</p>
								{{ end }}`,
		chips: ['pozvánka', '21 dní', 'pavilón B'],
		cta: {
			href: '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=invite&amp;next=/loans',
			label: 'Prijať pozvánku'
		},
		code: { label: 'Kód, ak odkaz nefunguje', value: '{{ .Token }}' },
		foot: 'Ak si pozvánku nečakal, tento list zahoď. Platí pre {{ .Email }}.'
	},
	{
		file: 'magic_link.html',
		title: 'Vstup do fondu',
		subject: 'Vstup do fondu · SPŠT knižnica',
		kicker: 'jednorazový vstup',
		heading: 'Vstúp do fondu.',
		body: `<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									Odkaz ťa prihlási do školskej knižnice. Platí krátko a len raz.
								</p>`,
		chips: ['raz', 'krátko', 'pavilón B'],
		cta: {
			href: '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=magiclink&amp;next=/loans',
			label: 'Vstúpiť'
		},
		code: { label: 'Kód, ak odkaz nefunguje', value: '{{ .Token }}' },
		foot: 'Ak si o vstup nežiadal, list zahoď.'
	},
	{
		file: 'recovery.html',
		title: 'Nové heslo',
		subject: 'Nové heslo · SPŠT knižnica',
		kicker: 'obnova hesla',
		heading: 'Nastav nové heslo.',
		body: `<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									Prišla žiadosť o obnovu pre {{ .Email }}. Odkaz platí krátko a použiješ ho raz. Heslo na pulte nehlásime.
								</p>`,
		chips: ['raz', 'krátko', 'pavilón B'],
		cta: {
			href: '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/login/password',
			label: 'Nastaviť heslo'
		},
		code: { label: 'Kód, ak odkaz nefunguje', value: '{{ .Token }}' },
		foot: 'Ak si o obnovu nežiadal, tento list zahoď. Účet ostane ako bol.'
	},
	{
		file: 'email_change.html',
		title: 'Nová adresa',
		subject: 'Nová adresa · SPŠT knižnica',
		kicker: 'zmena e-mailu',
		heading: 'Potvrď novú adresu.',
		body: `<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									Preukaz sa má viazať na {{ .NewEmail }}. Kým odkaz neotvoríš, platí ešte {{ .Email }}.
								</p>`,
		chips: ['nová adresa', 'pavilón B'],
		cta: {
			href: '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email_change&amp;next=/loans',
			label: 'Potvrdiť adresu'
		},
		code: { label: 'Kód, ak odkaz nefunguje', value: '{{ .Token }}' },
		foot: 'Ak si o zmenu nežiadal, list zahoď a ozvi sa na pulte.'
	},
	{
		file: 'reauthentication.html',
		title: 'Overenie preukazu',
		subject: 'Overenie · SPŠT knižnica',
		kicker: 'overenie preukazu',
		heading: 'Potvrď, že si to ty.',
		body: `<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									Citlivá zmena na preukaze {{ .Email }} potrebuje ešte raz odtlačok. Kód platí krátko. Heslo na pulte nehlásime.
								</p>`,
		chips: ['raz', 'krátko', 'pavilón B'],
		cta: { href: '{{ .SiteURL }}/profile', label: 'Otvoriť preukaz' },
		code: { label: 'Kód na overenie', value: '{{ .Token }}' },
		codeFirst: true,
		foot: 'Ak si o zmenu nežiadal, tento list zahoď. Účet ostane ako bol.'
	},
	{
		file: 'password_changed_notification.html',
		title: 'Heslo je nové',
		subject: 'Heslo je nové · SPŠT knižnica',
		kicker: 'pečiatka hesla',
		heading: 'Heslo je nové.',
		body: `<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									Na preukaze {{ .Email }} sa zmenilo heslo. Výpožičky ostávajú — prihlasuješ sa novým odtlačkom.
								</p>`,
		chips: ['preukaz', 'pavilón B'],
		cta: { href: '{{ .SiteURL }}/login/recovery', label: 'Obnoviť heslo' },
		foot: 'Ak si heslo nemenil ty, hneď obnov prístup a ozvi sa na pulte.'
	},
	{
		file: 'email_changed_notification.html',
		title: 'Adresa je nová',
		subject: 'Adresa je nová · SPŠT knižnica',
		kicker: 'pečiatka adresy',
		heading: 'Adresa je nová.',
		body: `<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									Preukaz sa viaže z {{ .OldEmail }} na {{ .Email }}. Listy výpožičky pôjdu na novú adresu.
								</p>`,
		chips: ['preukaz', 'pavilón B'],
		cta: { href: '{{ .SiteURL }}/profile', label: 'Otvoriť preukaz' },
		foot: 'Ak si adresu nemenil ty, ozvi sa na pulte. Účet môže byť ohrozený.'
	},
	{
		file: 'phone_changed_notification.html',
		title: 'Telefón je nový',
		subject: 'Telefón je nový · SPŠT knižnica',
		kicker: 'pečiatka telefónu',
		heading: 'Telefón je nový.',
		body: `<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									Na preukaze {{ .Email }} sa zmenilo číslo z {{ .OldPhone }} na {{ .Phone }}.
								</p>`,
		chips: ['preukaz', 'pavilón B'],
		cta: { href: '{{ .SiteURL }}/profile', label: 'Otvoriť preukaz' },
		foot: 'Ak si číslo nemenil ty, ozvi sa na pulte.'
	},
	{
		file: 'identity_linked_notification.html',
		title: 'Nový vstup',
		subject: 'Nový vstup · SPŠT knižnica',
		kicker: 'pečiatka vstupu',
		heading: 'Pribudol vstup.',
		body: `<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									K preukazu {{ .Email }} sa viaže nový spôsob prihlásenia: {{ .Provider }}.
								</p>`,
		chips: ['vstup', 'pavilón B'],
		cta: { href: '{{ .SiteURL }}/profile', label: 'Otvoriť preukaz' },
		foot: 'Ak si to nerobil ty, ozvi sa na pulte a vstup zrušíme.'
	},
	{
		file: 'identity_unlinked_notification.html',
		title: 'Vstup stiahnutý',
		subject: 'Vstup stiahnutý · SPŠT knižnica',
		kicker: 'pečiatka vstupu',
		heading: 'Vstup je preč.',
		body: `<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									Z preukazu {{ .Email }} sme stiahli spôsob prihlásenia: {{ .Provider }}.
								</p>`,
		chips: ['vstup', 'pavilón B'],
		cta: { href: '{{ .SiteURL }}/profile', label: 'Otvoriť preukaz' },
		foot: 'Ak si to nerobil ty, ozvi sa na pulte.'
	},
	{
		file: 'mfa_factor_enrolled_notification.html',
		title: 'Overenie pridané',
		subject: 'Overenie pridané · SPŠT knižnica',
		kicker: 'pečiatka overenia',
		heading: 'Overenie pribudlo.',
		body: `<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									Na preukaze {{ .Email }} je nové overenie prihlásenia: {{ .FactorType }}.
								</p>`,
		chips: ['overenie', 'pavilón B'],
		cta: { href: '{{ .SiteURL }}/profile', label: 'Otvoriť preukaz' },
		foot: 'Ak si overenie nepridával ty, ozvi sa na pulte.'
	},
	{
		file: 'mfa_factor_unenrolled_notification.html',
		title: 'Overenie preč',
		subject: 'Overenie preč · SPŠT knižnica',
		kicker: 'pečiatka overenia',
		heading: 'Overenie je preč.',
		body: `<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">
									Z preukazu {{ .Email }} sme stiahli overenie: {{ .FactorType }}.
								</p>`,
		chips: ['overenie', 'pavilón B'],
		cta: { href: '{{ .SiteURL }}/profile', label: 'Otvoriť preukaz' },
		foot: 'Ak si overenie nestiahol ty, ozvi sa na pulte.'
	}
];

function chipRow(chips: string[]) {
	return chips
		.map(
			(label, i) =>
				`${i ? '<td width="8"></td>' : ''}<td style="padding:5px 9px;border:1px solid #d7c4ae;font-family:Courier,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5c4a3c;">${label}</td>`
		)
		.join('');
}

function render(slip: Slip) {
	const cta = slip.cta
		? `<p style="margin:24px 0 0;">
									<a href="${slip.cta.href}" style="display:inline-block;padding:14px 22px;background:#3c2a21;color:#fff8ee;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;text-decoration:none;">
										${slip.cta.label}
									</a>
								</p>`
		: '';
	const code = slip.code
		? `<p style="margin:26px 0 0;padding-top:18px;border-top:1px dashed #d7c4ae;font-family:Courier,monospace;font-size:12px;letter-spacing:0.08em;color:#7a6554;">
									${slip.code.label}<br />
									<span style="display:inline-block;margin-top:6px;font-size:24px;letter-spacing:0.32em;color:#2c1d16;">${slip.code.value}</span>
								</p>`
		: '';

	// Body already wraps <p> when needed; keep as fragment after h1.
	const body = slip.body.trim().startsWith('<')
		? slip.body
		: `<p style="margin:14px 0 0;font-size:17px;line-height:1.5;color:#5c4a3c;">${slip.body}</p>`;

	return `<!doctype html>
<html lang="sk">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<meta name="color-scheme" content="light" />
		<title>${slip.title}</title>
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
											${slip.kicker}
										</td>
										<td align="right" style="width:64px;">
											<span style="display:inline-block;padding:6px 9px 5px;border:2px solid #c45a38;border-radius:999px;color:#c45a38;font-size:12px;font-style:italic;font-weight:700;letter-spacing:0.14em;">SPŠT</span>
										</td>
									</tr>
								</table>
								<h1 style="margin:18px 0 0;font-size:34px;line-height:0.98;letter-spacing:-0.03em;font-weight:700;">
									${slip.heading}
								</h1>
								${body}
								<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 0;">
									<tr>${chipRow(slip.chips)}</tr>
								</table>
								${slip.codeFirst ? `${code}\n\t\t\t\t\t\t\t\t${cta}` : `${cta}\n\t\t\t\t\t\t\t\t${code}`}
								<p style="margin:16px 0 0;font-size:14px;line-height:1.45;color:#7a6554;">
									${slip.foot}
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
</html>
`;
}

mkdirSync(OUT, { recursive: true });

const subjects: Record<string, string> = {};
for (const slip of slips) {
	writeFileSync(join(OUT, slip.file), render(slip), 'utf8');
	subjects[slip.file] = slip.subject;
	console.log(`wrote ${slip.file}`);
}

writeFileSync(
	join(OUT, 'subjects.json'),
	`${JSON.stringify(subjects, null, '\t')}\n`,
	'utf8'
);
console.log('wrote subjects.json');
