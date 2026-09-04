import { stampDate } from '@/utils/format';
import { sendMail } from '@/server/mail';
import { escapeHtml, mailOrigin, slipHtml } from '@/server/mail-slip';

export type ClassDigestRow = {
	title: string;
	reader: string;
	dueAt: Date;
	late: boolean;
};

export type ClassDigest = {
	to: string;
	teacherName: string;
	className: string;
	open: number;
	overdue: number;
	rows: ClassDigestRow[];
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function shouldMailClassDigest(input: {
	open: number;
	overdue: number;
	lastOverdue: number;
	mailedAt: Date | null;
	now?: Date;
}) {
	if (input.open <= 0) return false;
	const now = input.now ?? new Date();
	const stale = !input.mailedAt || now.getTime() - input.mailedAt.getTime() >= WEEK_MS;
	const newOverdue = input.overdue > input.lastOverdue;
	return stale || newOverdue;
}

export function classDigestCopy(digest: ClassDigest) {
	const name = digest.teacherName.trim() || 'Učiteľ';
	const klass = digest.className.trim() || 'trieda';
	const deskHref = `${mailOrigin()}/admin/loans?class=${encodeURIComponent(klass)}&open=1`;
	const late = digest.overdue;
	const slips =
		digest.open === 1 ? 'lístok' : digest.open >= 2 && digest.open <= 4 ? 'lístky' : 'lístkov';
	const subject =
		late > 0
			? `${klass} vonku · ${digest.open} ${slips}, ${late} po lehote · SPŠT knižnica`
			: `${klass} vonku · ${digest.open} ${slips} · SPŠT knižnica`;

	const lines = digest.rows.slice(0, 12).map((row) => {
		const due = stampDate(row.dueAt);
		return `${row.late ? 'po lehote' : 'vonku'} · ${row.reader} · ${row.title} · ${due}`;
	});
	const more =
		digest.rows.length > 12 ? `… a ešte ${digest.rows.length - 12} lístkov na pulte.` : '';

	const text = [
		`${name}, v triede ${klass} je ${digest.open} kníh vonku` +
			(late ? `, z toho ${late} po lehote.` : '.'),
		...lines,
		more,
		`Pult: ${deskHref}`
	]
		.filter(Boolean)
		.join('\n');

	const list = digest.rows
		.slice(0, 12)
		.map((row) => {
			const mark = row.late ? 'po lehote' : 'vonku';
			return `${escapeHtml(row.reader)} — ${escapeHtml(row.title)} (${escapeHtml(mark)}, do ${escapeHtml(stampDate(row.dueAt))})`;
		})
		.join('<br />');

	const html = slipHtml({
		kicker: `trieda ${klass}`,
		heading: late ? 'Po lehote v triede.' : 'Trieda vonku.',
		body: `${escapeHtml(name)}, v <strong>${escapeHtml(klass)}</strong> je ${digest.open} kníh na čitateľoch${late ? `, z toho ${late} po termíne` : ''}.<br /><br />${list}${more ? `<br /><br />${escapeHtml(more)}` : ''}`,
		chips: [`${digest.open} vonku`, late ? `${late} po lehote` : null, klass, 'pavilón B'],
		ctaHref: deskHref,
		cta: 'Čo je vonku',
		foot: 'Fond nemeníš. Oneskorenie rieši pult, v aplikácii poplatok nie je. List ide raz za týždeň, alebo keď pribudne oneskorenie.'
	});

	return { subject, text, html };
}

export async function queueClassDigest(digest: ClassDigest) {
	if (!digest.to.trim()) return { ok: false as const, skipped: true };
	const copy = classDigestCopy(digest);
	return sendMail({
		to: digest.to,
		toName: digest.teacherName,
		...copy
	});
}
