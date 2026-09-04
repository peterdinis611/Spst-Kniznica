export type XmlAttrs = Record<string, string | number>;

export type XmlEl = {
	name: string;
	attrs?: XmlAttrs;
	text?: string | number;
	children?: XmlEl[];
};

export type XmlToken = {
	kind: 'decl' | 'punct' | 'name' | 'attr' | 'string' | 'text' | 'indent';
	value: string;
};

export type XmlLine = {
	n: number;
	tokens: XmlToken[];
};

export function xmlEscape(value: string | number) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function attrList(attrs?: XmlAttrs) {
	if (!attrs) return '';
	return Object.entries(attrs)
		.map(([name, value]) => ` ${name}="${xmlEscape(value)}"`)
		.join('');
}

function writeEl(el: XmlEl, depth: number): string {
	const pad = '\t'.repeat(depth);
	const attrs = attrList(el.attrs);
	if (el.text !== undefined && !el.children?.length) {
		return `${pad}<${el.name}${attrs}>${xmlEscape(el.text)}</${el.name}>`;
	}
	if (!el.children?.length) {
		return `${pad}<${el.name}${attrs}/>`;
	}
	const inner = el.children.map((child) => writeEl(child, depth + 1)).join('\n');
	return `${pad}<${el.name}${attrs}>\n${inner}\n${pad}</${el.name}>`;
}

export function toXml(root: XmlEl) {
	return `<?xml version="1.0" encoding="UTF-8"?>\n${writeEl(root, 0)}\n`;
}

export function xmlResponse(filename: string, body: string) {
	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'content-disposition': `attachment; filename="${filename}"`
		}
	});
}

export function tokenizeXml(xml: string): XmlLine[] {
	return xml
		.replace(/\n$/, '')
		.split('\n')
		.map((line, index) => ({
			n: index + 1,
			tokens: tokenizeXmlLine(line)
		}));
}

function tokenizeXmlLine(line: string): XmlToken[] {
	const tokens: XmlToken[] = [];
	let i = 0;
	while (i < line.length && line[i] === '\t') {
		i += 1;
	}
	if (i > 0) tokens.push({ kind: 'indent', value: line.slice(0, i) });
	const rest = line.slice(i);
	if (rest.startsWith('<?')) {
		tokens.push({ kind: 'decl', value: rest });
		return tokens;
	}

	let cursor = 0;
	while (cursor < rest.length) {
		if (rest.startsWith('</', cursor) || rest[cursor] === '<') {
			const close = rest.startsWith('</', cursor);
			tokens.push({ kind: 'punct', value: close ? '</' : '<' });
			cursor += close ? 2 : 1;
			const name = rest.slice(cursor).match(/^[A-Za-z_][\w:.-]*/)?.[0] ?? '';
			if (name) {
				tokens.push({ kind: 'name', value: name });
				cursor += name.length;
			}
			while (cursor < rest.length && rest[cursor] !== '>' && rest[cursor] !== '/') {
				if (/\s/.test(rest[cursor])) {
					tokens.push({ kind: 'punct', value: rest[cursor] });
					cursor += 1;
					continue;
				}
				const attr = rest.slice(cursor).match(/^[A-Za-z_][\w:.-]*/)?.[0] ?? '';
				if (attr) {
					tokens.push({ kind: 'attr', value: attr });
					cursor += attr.length;
					continue;
				}
				if (rest[cursor] === '=') {
					tokens.push({ kind: 'punct', value: '=' });
					cursor += 1;
					continue;
				}
				if (rest[cursor] === '"') {
					const end = rest.indexOf('"', cursor + 1);
					const stop = end === -1 ? rest.length : end + 1;
					tokens.push({ kind: 'string', value: rest.slice(cursor, stop) });
					cursor = stop;
					continue;
				}
				tokens.push({ kind: 'punct', value: rest[cursor] });
				cursor += 1;
			}
			if (rest.startsWith('/>', cursor)) {
				tokens.push({ kind: 'punct', value: '/>' });
				cursor += 2;
				continue;
			}
			if (rest[cursor] === '>') {
				tokens.push({ kind: 'punct', value: '>' });
				cursor += 1;
				continue;
			}
			continue;
		}
		const next = rest.indexOf('<', cursor);
		const stop = next === -1 ? rest.length : next;
		if (stop > cursor) {
			tokens.push({ kind: 'text', value: rest.slice(cursor, stop) });
			cursor = stop;
			continue;
		}
		tokens.push({ kind: 'punct', value: rest[cursor] });
		cursor += 1;
	}
	return tokens;
}
