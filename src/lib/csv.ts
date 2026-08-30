export function csvCell(value: string | number) {
	const text = String(value);
	if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
	return text;
}

export function toCsv(headers: string[], rows: Array<Array<string | number>>) {
	const lines = [headers, ...rows].map((row) => row.map(csvCell).join(','));
	return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function parseCsv(body: string): { headers: string[]; rows: string[][] } {
	const text = body.replace(/^\uFEFF/, '');
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = '';
	let quoted = false;

	for (let i = 0; i < text.length; i += 1) {
		const ch = text[i];
		if (quoted) {
			if (ch === '"') {
				if (text[i + 1] === '"') {
					cell += '"';
					i += 1;
				} else {
					quoted = false;
				}
				continue;
			}
			cell += ch;
			continue;
		}
		if (ch === '"') {
			quoted = true;
			continue;
		}
		if (ch === ',') {
			row.push(cell);
			cell = '';
			continue;
		}
		if (ch === '\n') {
			row.push(cell);
			rows.push(row);
			row = [];
			cell = '';
			continue;
		}
		if (ch === '\r') continue;
		cell += ch;
	}

	if (quoted || cell.length > 0 || row.length > 0) {
		row.push(cell);
		rows.push(row);
	}

	while (rows.length && rows.at(-1)?.length === 1 && rows.at(-1)?.[0] === '') {
		rows.pop();
	}

	const headers = rows.shift() ?? [];
	return { headers, rows };
}

export function csvFileStamp(now = new Date()) {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function csvResponse(filename: string, body: string) {
	return new Response(body, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="${filename}"`
		}
	});
}
