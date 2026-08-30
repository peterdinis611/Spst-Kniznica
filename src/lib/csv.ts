export function csvCell(value: string | number) {
	const text = String(value);
	if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
	return text;
}

export function toCsv(headers: string[], rows: Array<Array<string | number>>) {
	const lines = [headers, ...rows].map((row) => row.map(csvCell).join(','));
	return `\uFEFF${lines.join('\r\n')}\r\n`;
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
