export type DocMeta = {
	title: string;
	description?: string;
	order?: number;
};

const FRONT = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseFrontMatter(raw: string): { data: DocMeta; body: string } {
	const match = raw.match(FRONT);
	if (!match) return { data: { title: 'Príručka' }, body: raw.trim() };

	const data: DocMeta = { title: 'Príručka' };
	for (const line of match[1].split('\n')) {
		const colon = line.indexOf(':');
		if (colon < 0) continue;
		const key = line.slice(0, colon).trim();
		let value = line.slice(colon + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (key === 'title') data.title = value;
		if (key === 'description') data.description = value;
		if (key === 'order') {
			const order = Number(value);
			if (Number.isFinite(order)) data.order = order;
		}
	}

	return { data, body: match[2].trim() };
}

export function escapeHtml(value: string) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function safeHref(href: string) {
	return /^(https?:\/\/|mailto:|\/|#)/i.test(href) && !/[\s<>"'`]/.test(href);
}

export function renderInline(source: string) {
	let out = escapeHtml(source);
	out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
	out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_all, label: string, href: string) => {
		if (!safeHref(href)) return label;
		return `<a href="${escapeHtml(href)}">${label}</a>`;
	});
	return out;
}

function isTableSeparator(line: string) {
	return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function tableCells(line: string) {
	return line
		.replace(/^\|/, '')
		.replace(/\|$/, '')
		.split('|')
		.map((cell) => renderInline(cell.trim()));
}

export function renderHandbookMarkdown(source: string) {
	const lines = source.replaceAll('\r\n', '\n').split('\n');
	const out: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i] ?? '';
		if (!line.trim()) {
			i += 1;
			continue;
		}

		if (line.startsWith('```')) {
			const fence: string[] = [];
			i += 1;
			while (i < lines.length && !lines[i]?.startsWith('```')) {
				fence.push(lines[i] ?? '');
				i += 1;
			}
			if (i < lines.length) i += 1;
			out.push(`<pre><code>${escapeHtml(fence.join('\n'))}</code></pre>`);
			continue;
		}

		if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1] ?? '')) {
			const head = tableCells(line);
			i += 2;
			const rows: string[][] = [];
			while (i < lines.length && (lines[i] ?? '').includes('|')) {
				rows.push(tableCells(lines[i] ?? ''));
				i += 1;
			}
			const thead = `<tr>${head.map((cell) => `<th>${cell}</th>`).join('')}</tr>`;
			const tbody = rows
				.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
				.join('');
			out.push(`<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`);
			continue;
		}

		const heading = /^(#{1,3})\s+(.+)$/.exec(line);
		if (heading) {
			const level = heading[1]?.length ?? 2;
			out.push(`<h${level}>${renderInline(heading[2] ?? '')}</h${level}>`);
			i += 1;
			continue;
		}

		if (/^[-*]\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? '')) {
				items.push(`<li>${renderInline((lines[i] ?? '').replace(/^[-*]\s+/, ''))}</li>`);
				i += 1;
			}
			out.push(`<ul>${items.join('')}</ul>`);
			continue;
		}

		if (/^\d+\.\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\d+\.\s+/.test(lines[i] ?? '')) {
				items.push(`<li>${renderInline((lines[i] ?? '').replace(/^\d+\.\s+/, ''))}</li>`);
				i += 1;
			}
			out.push(`<ol>${items.join('')}</ol>`);
			continue;
		}

		const para: string[] = [line];
		i += 1;
		while (i < lines.length) {
			const next = lines[i] ?? '';
			if (!next.trim()) break;
			if (next.startsWith('```') || next.startsWith('#') || next.startsWith('|')) break;
			if (/^[-*]\s+/.test(next) || /^\d+\.\s+/.test(next)) break;
			para.push(next);
			i += 1;
		}
		out.push(`<p>${renderInline(para.join(' '))}</p>`);
	}

	return out.join('');
}
